import { Q, SKY_GLSL, THREE } from '../app.js';

/* ─────────── post-processing: our own compact HDR pipeline ─────────── */
const FSQ_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const GLSL_COMMON = `
  float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h12(i), h12(i+vec2(1,0)), f.x), mix(h12(i+vec2(0,1)), h12(i+vec2(1,1)), f.x), f.y); }`;
class Post {
  constructor(r) {
    this.r = r;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.qscene = new THREE.Scene(); this.qscene.add(this.quad);
    const hf = r.capabilities.isWebGL2 && (r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float'));
    this.type = hf ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.hdr = hf;
    const mk = (opts = {}) => new THREE.WebGLRenderTarget(1, 1, Object.assign({ type: this.type, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }, opts));
    this.rtScene = new THREE.WebGLRenderTarget(1, 1, { type: this.type, samples: Q.msaa, depthBuffer: true, depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType) });
    this.rtAO = mk(); this.rtAO2 = mk();
    this.bloom = [0, 1, 2, 3, 4].map(() => mk());
    this.blur = [0, 1, 2].map(() => mk());
    this.m = {
      down: new THREE.ShaderMaterial({ uniforms: { src: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: 0 } }, vertexShader: FSQ_VS, depthTest: false, depthWrite: false,
        fragmentShader: `uniform sampler2D src; uniform vec2 texel; uniform float threshold; varying vec2 vUv;
          vec3 s(vec2 o){ return texture2D(src, vUv + texel * o).rgb; }
          void main(){
            vec3 c = s(vec2(0))*0.125 + (s(vec2(-2,2))+s(vec2(2,2))+s(vec2(-2,-2))+s(vec2(2,-2)))*0.03125
                   + (s(vec2(0,2))+s(vec2(-2,0))+s(vec2(2,0))+s(vec2(0,-2)))*0.0625 + (s(vec2(-1,1))+s(vec2(1,1))+s(vec2(-1,-1))+s(vec2(1,-1)))*0.125;
            if (threshold > 0.0) { float l = dot(c, vec3(.2126,.7152,.0722)); c *= smoothstep(threshold, threshold * 2.2, l); }
            gl_FragColor = vec4(min(c, vec3(60.0)), 1.0); }` }),
      up: new THREE.ShaderMaterial({ uniforms: { src: { value: null }, texel: { value: new THREE.Vector2() } }, vertexShader: FSQ_VS, depthTest: false, depthWrite: false,
        blending: THREE.AdditiveBlending, transparent: true,
        fragmentShader: `uniform sampler2D src; uniform vec2 texel; varying vec2 vUv;
          vec3 s(vec2 o){ return texture2D(src, vUv + texel * o).rgb; }
          void main(){ vec3 c = s(vec2(0))*4.0 + (s(vec2(-1,0))+s(vec2(1,0))+s(vec2(0,-1))+s(vec2(0,1)))*2.0 + s(vec2(-1,-1))+s(vec2(1,-1))+s(vec2(-1,1))+s(vec2(1,1));
            gl_FragColor = vec4(c / 16.0, 1.0); }` }),
      ao: new THREE.ShaderMaterial({ uniforms: { tDepth: { value: null }, res: { value: new THREE.Vector2() }, projInv: { value: new THREE.Matrix4() }, py: { value: 1 }, radius: { value: .45 }, intensity: { value: 1.2 } },
        vertexShader: FSQ_VS, depthTest: false, depthWrite: false,
        fragmentShader: `uniform sampler2D tDepth; uniform vec2 res; uniform mat4 projInv; uniform float py, radius, intensity; varying vec2 vUv;
          ${GLSL_COMMON}
          vec3 vp(vec2 uv){ float z = texture2D(tDepth, uv).x; vec4 c = vec4(uv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); vec4 v = projInv * c; return v.xyz / v.w; }
          void main(){
            float z0 = texture2D(tDepth, vUv).x;
            if (z0 >= 0.99999) { gl_FragColor = vec4(1.0); return; }
            vec3 P = vp(vUv); vec2 px = 1.0 / res;
            vec3 dx1 = vp(vUv + vec2(px.x, 0.)) - P, dx2 = P - vp(vUv - vec2(px.x, 0.));
            vec3 dy1 = vp(vUv + vec2(0., px.y)) - P, dy2 = P - vp(vUv - vec2(0., px.y));
            vec3 N = normalize(cross(abs(dx1.z) < abs(dx2.z) ? dx1 : dx2, abs(dy1.z) < abs(dy2.z) ? dy1 : dy2));
            float rs = radius * py * 0.5 / max(0.2, -P.z);
            float a0 = h12(gl_FragCoord.xy) * 6.2831, occ = 0.0;
            for (int i = 0; i < 12; i++) {
              float t = (float(i) + 0.5) / 12.0, a = a0 + t * 37.7;
              vec2 o = vec2(cos(a), sin(a)) * rs * t;
              vec3 v = vp(vUv + o) - P;
              float vv = dot(v, v);
              occ += max(0.0, dot(v, N) - 0.01 * -P.z) / (vv + 0.02) * smoothstep(radius * 2.5, radius * 0.5, sqrt(vv));
            }
            gl_FragColor = vec4(vec3(clamp(1.0 - intensity * occ / 12.0, 0.0, 1.0)), 1.0);
          }` }),
      aoBlur: new THREE.ShaderMaterial({ uniforms: { src: { value: null }, tDepth: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: FSQ_VS, depthTest: false, depthWrite: false,
        fragmentShader: `uniform sampler2D src, tDepth; uniform vec2 dir; varying vec2 vUv;
          void main(){ float d0 = texture2D(tDepth, vUv).x, s = 0.0, w = 0.0;
            for (int i = -3; i <= 3; i++) { vec2 uv = vUv + dir * float(i); float d = texture2D(tDepth, uv).x;
              float k = exp(-float(i*i) / 8.0) * (1.0 / (1e-4 + abs(d - d0) * 4000.0)); s += texture2D(src, uv).r * k; w += k; }
            gl_FragColor = vec4(vec3(s / w), 1.0); }` }),
      comp: new THREE.ShaderMaterial({
        uniforms: {
          tScene: { value: null }, tBloom: { value: null }, tB1: { value: null }, tB2: { value: null }, tAO: { value: null }, tDepth: { value: null },
          near: { value: .1 }, far: { value: 100 }, focus: { value: 8 }, aperture: { value: 0 }, bloom: { value: .06 }, aoStrength: { value: 0 },
          exposure: { value: 1 }, contrast: { value: 1.0 }, saturation: { value: 1 }, lift: { value: new THREE.Vector3() }, gain: { value: new THREE.Vector3(1, 1, 1) },
          vignette: { value: .28 }, grain: { value: .018 }, time: { value: 0 }, shimmer: { value: 0 },
          ldr: { value: 0 }, thermal: { value: 0 }, extinction: { value: new THREE.Vector3(3e-4, 3.5e-4, 4.2e-4) }, airK: { value: 1 },
          uProjInvC: { value: new THREE.Matrix4() }, uCamInvViewC: { value: new THREE.Matrix4() },
        },
        vertexShader: FSQ_VS, depthTest: false, depthWrite: false,
        fragmentShader: `uniform sampler2D tScene, tBloom, tB1, tB2, tAO, tDepth;
          uniform float near, far, focus, aperture, bloom, aoStrength, exposure, contrast, saturation, vignette, grain, time, shimmer, ldr, thermal, airK;
          uniform vec3 lift, gain, extinction; uniform mat4 uProjInvC, uCamInvViewC; varying vec2 vUv;
          uniform vec3 uDustCol;
          ${GLSL_COMMON}
          ${SKY_GLSL}
          float lz(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
          vec3 heatPal(float t){ t = clamp(t, 0.0, 1.0);
            vec3 c0 = vec3(0.02,0.01,0.09), c1 = vec3(0.16,0.02,0.33), c2 = vec3(0.55,0.06,0.33), c3 = vec3(0.9,0.27,0.12), c4 = vec3(1.0,0.62,0.12), c5 = vec3(1.0,0.95,0.7);
            float s = t * 5.0;
            if (s < 1.0) return mix(c0, c1, s); if (s < 2.0) return mix(c1, c2, s - 1.0);
            if (s < 3.0) return mix(c2, c3, s - 2.0); if (s < 4.0) return mix(c3, c4, s - 3.0); return mix(c4, c5, s - 4.0); }
          /* AgX (Blender / Filament; as in three.js r170) */
          vec3 agxCurve(vec3 x){ vec3 x2 = x * x, x4 = x2 * x2;
            return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232; }
          vec3 agx(vec3 c){
            const mat3 toRec2020 = mat3(vec3(0.6274, 0.0691, 0.0164), vec3(0.3293, 0.9195, 0.0880), vec3(0.0433, 0.0113, 0.8956));
            const mat3 toSRGB = mat3(vec3(1.6605, -0.1246, -0.0182), vec3(-0.5876, 1.1329, -0.1006), vec3(-0.0728, -0.0083, 1.1187));
            const mat3 inset = mat3(vec3(0.856627153315983, 0.137318972929847, 0.11189821299995), vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903), vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
            const mat3 outset = mat3(vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826), vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294), vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
            c = inset * (toRec2020 * c);
            c = clamp((log2(max(c, 1e-10)) + 12.47393) / 16.5, 0.0, 1.0);
            c = outset * agxCurve(c);
            c = pow(max(c, 0.0), vec3(2.2));
            return clamp(toSRGB * c, 0.0, 1.0);
          }
          vec3 oetf(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
          void main(){
            vec2 uv = vUv;
            float d = texture2D(tDepth, uv).x, vz = lz(d), skyPx = step(0.99999, d);
            if (shimmer > 0.0) {
              float m = shimmer * smoothstep(3.0, 12.0, vz) * (1.0 - skyPx * 0.4);
              uv += (vec2(vn2(uv * vec2(40.0, 70.0) + vec2(0.0, time * 1.4)), vn2(uv * vec2(50.0, 60.0) - vec2(time, 0.0))) - 0.5) * 0.0028 * m;
            }
            vec3 c = texture2D(tScene, uv).rgb;
            if (aoStrength > 0.0) c *= mix(1.0, texture2D(tAO, uv).r, aoStrength * (1.0 - skyPx));
            if (aperture > 0.0) {
              float coc = clamp(abs(vz - focus) * aperture / max(vz, 0.3), 0.0, 1.0);
              c = mix(c, texture2D(tB1, uv).rgb, smoothstep(0.15, 0.55, coc));
              c = mix(c, texture2D(tB2, uv).rgb, smoothstep(0.55, 1.0, coc));
            }
            if (thermal > 0.5) {
              // thermal camera: the scene's raw radiance stands in for temperature; the camel writes its own
              float lt = dot(c, vec3(.2126, .7152, .0722)) * exposure;
              vec3 th = heatPal(1.0 - exp(-lt * 1.6));
              th += (h12(gl_FragCoord.xy + fract(time * 5.1) * 71.0) - 0.5) * 0.035;
              vec2 q2 = vUv - 0.5; th *= 1.0 - 0.35 * dot(q2, q2);
              gl_FragColor = vec4(pow(clamp(th, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
              return;
            }
            // aerial perspective: light lost along the view ray, replaced by airlight (the horizon sky itself)
            if (skyPx < 0.5) {
              vec4 vp = uProjInvC * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); vp /= vp.w;
              float dist = length(vp.xyz);
              vec3 wd = normalize((uCamInvViewC * vec4(vp.xyz, 0.0)).xyz);
              vec3 T = exp(-extinction * dist);
              vec3 air = skyRad(normalize(vec3(wd.x, max(wd.y, 0.0) * 0.3 + 0.02, wd.z)));
              air = mix(air, uDustCol, uStorm);
              c = c * T + air * airK * (1.0 - T);
            }
            c += texture2D(tBloom, vUv).rgb * bloom;
            c *= exposure;
            c = c * gain + lift;
            c = ldr > 0.5 ? clamp(c, 0.0, 1.0) : agx(c);
            float l = dot(c, vec3(.2126, .7152, .0722));
            c = max(mix(vec3(l), c, saturation), 0.0);
            c = oetf(c);
            c = clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
            c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
            vec2 q = vUv - 0.5; c *= 1.0 - vignette * dot(q, q) * 1.7;
            c += (h12(gl_FragCoord.xy + fract(time * 7.13) * 91.0) - 0.5) * grain;
            gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
          }` }),
    };
    this.params = this.m.comp.uniforms;
  }
  setSize(w, h) {
    this.w = w; this.h = h;
    this.rtScene.setSize(w, h);
    if (this.rtScene.depthTexture) { this.rtScene.depthTexture.image.width = w; this.rtScene.depthTexture.image.height = h; }
    const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);
    this.rtAO.setSize(hw, hh); this.rtAO2.setSize(hw, hh);
    this.bloom.forEach((t, i) => t.setSize(Math.max(1, w >> (i + 1)), Math.max(1, h >> (i + 1))));
    this.blur.forEach((t, i) => t.setSize(Math.max(1, w >> (i + 1)), Math.max(1, h >> (i + 1))));
  }
  pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.qscene, this.cam); }
  render(scene, camera, t) {
    const r = this.r, m = this.m, P = this.params;
    r.setRenderTarget(this.rtScene);
    r.render(scene, camera);
    const tex = this.rtScene.texture, depth = this.rtScene.depthTexture;
    // bloom: threshold + down chain, then additive tent up chain
    const bl = this.bloom;
    m.down.uniforms.threshold.value = this.hdr ? 1.25 / Math.max(P.exposure.value, 1e-6) : .82;
    for (let i = 0; i < bl.length; i++) {
      const src = i ? bl[i - 1].texture : tex;
      m.down.uniforms.src.value = src;
      m.down.uniforms.texel.value.set(1 / src.image.width, 1 / src.image.height);
      this.pass(m.down, bl[i]);
      if (i === 0) m.down.uniforms.threshold.value = 0;
    }
    for (let i = bl.length - 1; i > 0; i--) {
      m.up.uniforms.src.value = bl[i].texture;
      m.up.uniforms.texel.value.set(1 / bl[i].width, 1 / bl[i].height);
      this.pass(m.up, bl[i - 1]);
    }
    // blur pyramid for depth of field
    if (P.aperture.value > 0.001) {
      m.down.uniforms.threshold.value = 0;
      for (let i = 0; i < this.blur.length; i++) {
        const src = i ? this.blur[i - 1].texture : tex;
        m.down.uniforms.src.value = src; m.down.uniforms.texel.value.set(1 / src.image.width, 1 / src.image.height);
        this.pass(m.down, this.blur[i]);
      }
    }
    // ambient occlusion
    if (Q.ssao && depth) {
      m.ao.uniforms.tDepth.value = depth;
      m.ao.uniforms.res.value.set(this.rtAO.width, this.rtAO.height);
      m.ao.uniforms.projInv.value.copy(camera.projectionMatrixInverse);
      m.ao.uniforms.py.value = camera.projectionMatrix.elements[5] * this.rtAO.height;
      this.pass(m.ao, this.rtAO);
      m.aoBlur.uniforms.tDepth.value = depth;
      m.aoBlur.uniforms.src.value = this.rtAO.texture; m.aoBlur.uniforms.dir.value.set(1.5 / this.rtAO.width, 0); this.pass(m.aoBlur, this.rtAO2);
      m.aoBlur.uniforms.src.value = this.rtAO2.texture; m.aoBlur.uniforms.dir.value.set(0, 1.5 / this.rtAO.height); this.pass(m.aoBlur, this.rtAO);
    }
    P.tScene.value = tex; P.tBloom.value = bl[0].texture; P.tB1.value = this.blur[1].texture; P.tB2.value = this.blur[2].texture;
    P.tAO.value = this.rtAO.texture; P.tDepth.value = depth; P.near.value = camera.near; P.far.value = camera.far; P.time.value = t;
    P.uProjInvC.value.copy(camera.projectionMatrixInverse); P.uCamInvViewC.value.copy(camera.matrixWorld);
    P.aoStrength.value = Q.ssao ? P.aoStrength.value || .8 : 0;
    P.ldr.value = this.hdr ? 0 : 1;
    this.pass(m.comp, null);
  }
}

export { GLSL_COMMON, Post };
