import { Skia } from "@shopify/react-native-skia";

/**
 * ShaderLibrary defines GPU-accelerated atmospheric effects for Sigilborne.
 * These shaders use Fractional Brownian Motion (fBm) noise for organic movement.
 */
export const ShaderLibrary = {
    /**
     * Impenetrable Fog: A deep emerald swirling smoke effect.
     */
    fog: Skia.RuntimeEffect.Make(`
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_intensity;
        uniform vec3 u_color_primary;
        uniform vec3 u_color_secondary;

        float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
            for (int i = 0; i < 5; ++i) {
                v += a * noise(p);
                p = rot * p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        vec4 main(vec2 FragCoord) {
            vec2 uv = FragCoord / u_resolution.xy;
            uv.x *= u_resolution.x / u_resolution.y;
            
            vec2 p = uv * 3.0;
            float t = u_time * 0.2;
            
            float n = fbm(p + vec2(t, t * 0.5));
            n = fbm(p + n + t);
            
            vec3 color = mix(u_color_secondary, u_color_primary, n);
            float dist = distance(uv, vec2(0.5 * u_resolution.x / u_resolution.y, 0.5));
            color *= smoothstep(1.5, 0.4, dist); // Wider vignette
            
            return vec4(color, n * 0.9 * u_intensity); // Increased alpha
        }
    `)!,

    /**
     * Biting Frost: A shimmering, crystalline pale blue overlay.
     */
    frost: Skia.RuntimeEffect.Make(`
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_intensity;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec4 main(vec2 FragCoord) {
            vec2 uv = FragCoord / u_resolution.xy;
            float t = u_time * 0.5;
            float shimmer = hash(uv + t * 0.01) * hash(uv * 10.0 - t * 0.05);
            
            vec3 frostColor = vec3(0.9, 0.98, 1.0); // Brighter Blue
            float density = 0.5 + 0.2 * sin(t + uv.x * 5.0); // Higher base density
            
            return vec4(frostColor, (density + shimmer * 0.2) * u_intensity);
        }
    `)!,

    /**
     * Scorch Pulse: A violent destructive radial burst.
     */
    scorchPulse: Skia.RuntimeEffect.Make(`
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_origin;
        uniform float u_progress;

        vec4 main(vec2 FragCoord) {
            vec2 uv = FragCoord / u_resolution.xy;
            float dist = distance(FragCoord, u_origin);
            float radius = u_progress * max(u_resolution.x, u_resolution.y);
            
            float edge = smoothstep(radius - 50.0, radius, dist) * (1.0 - smoothstep(radius, radius + 20.0, dist));
            vec3 color = mix(vec3(0.06, 0.72, 0.51), vec3(0.8, 0.1, 0.1), u_progress);
            
            return vec4(color, edge * (1.0 - u_progress));
        }
    `)!,

    /**
     * Boost Pulse: A soft, upward flowing energy pulse.
     */
    boostPulse: Skia.RuntimeEffect.Make(`
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_progress;

        vec4 main(vec2 FragCoord) {
            vec2 uv = FragCoord / u_resolution.xy;
            float wave = sin(uv.x * 10.0 + u_time * 2.0) * 0.02;
            float mask = smoothstep(1.0 - u_progress - 0.3, 1.0 - u_progress, uv.y + wave);
            mask *= (1.0 - uv.y); 
            
            vec3 color = vec3(0.2, 1.0, 0.7); // Vivid Mint
            return vec4(color, mask * (1.0 - u_progress) * 0.7);
        }
    `)!,

    /**
     * Revive Ring: An expanding circular reconstruction ring.
     */
    reviveRing: Skia.RuntimeEffect.Make(`
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_origin;
        uniform float u_progress;

        vec4 main(vec2 FragCoord) {
            float dist = distance(FragCoord, u_origin);
            float radius = 20.0 + u_progress * 150.0; // Slightly larger
            float thickness = 15.0 * (1.0 - u_progress);
            
            float ring = smoothstep(radius - thickness, radius, dist) * (1.0 - smoothstep(radius, radius + thickness, dist));
            vec3 color = mix(vec3(0.0, 0.9, 1.0), vec3(0.2, 1.0, 0.8), u_progress);
            
            return vec4(color, ring * (1.0 - u_progress) * 0.9);
        }
    `)!,

    /**
     * Void Nebula: A deep, swirling obsidian and emerald backdrop for the main menu.
     */
    voidNebula: Skia.RuntimeEffect.Make(`
        uniform float u_time;
        uniform vec2 u_resolution;

        // Standard hash/noise functions
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; ++i) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }

        vec4 main(vec2 FragCoord) {
            vec2 uv = FragCoord / u_resolution.xy;
            float t = u_time * 0.1;
            
            // Layered swirling noise
            vec2 p = uv * 2.0;
            float n1 = fbm(p + vec2(t, t * 0.5));
            float n2 = fbm(p - n1 + t * 0.3);
            
            vec3 darkSky = vec3(0.02, 0.03, 0.05);
            vec3 emeraldGlow = vec3(0.02, 0.15, 0.1);
            
            vec3 color = mix(darkSky, emeraldGlow, n2 * 0.8);
            
            // Center focal brightness
            float dist = distance(uv, vec2(0.5, 0.5));
            color += emeraldGlow * (1.0 - smoothstep(0.0, 1.5, dist)) * 0.4;
            
            return vec4(color, 1.0);
        }
    `)!
};
