# Design, 3D and motion skills

Third-party Claude Code skills for Xplaind's visual design, 3D and animation work. The owner
installed them on 2026-11-02 with `install-web-skills.sh` (licence-restricted skills left out);
they are kept here so every session has them. CLAUDE.md says which skill to use when.

| Source | Skills it adds |
| --- | --- |
| https://github.com/anthropics/skills | frontend-design, skill-creator |
| https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | ui-ux-pro-max |
| https://github.com/Leonxlnx/taste-skill | design-taste-frontend (taste v2) |
| https://github.com/pbakaus/impeccable | impeccable |
| https://github.com/heydamir/unslop | unslop (by Damir Sokolovsky, CC BY 4.0; added 2026-11-13) |
| https://github.com/google-labs-code/stitch-skills | taste-design, shadcn-ui |
| https://github.com/cloudai-x/threejs-skills | threejs-* (fundamentals, materials, shaders and more) |
| https://github.com/dgreenheck/webgpu-claude-skill | webgpu-threejs-tsl |
| https://github.com/freshtechbro/claudedesignskills | gsap-scrolltrigger, motion-framer, lottie, rive, spline, barba-js and more |
| https://github.com/emalorenzo/three-agent-skills | three-best-practices, r3f-best-practices |
| https://github.com/enzed/r3f-skills | r3f-* |
| https://github.com/owenob1/web-shaders-agent-kit | web-shaders |
| https://github.com/majidmanzarpour/threejs-game-skills | threejs-game-*, threejs-aaa-graphics-builder and more |
| https://github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package | threejs-core-*, threejs-impl-*, threejs-syntax-* |
| https://github.com/greensock/gsap-skills | gsap-* |
| https://github.com/emilkowalski/skill | emil-design-eng, animate, review/improve/remove-animations, break-ui and more |
| https://github.com/kylezantos/design-motion-principles | design-motion-principles |
| https://github.com/devmartinese/awwwards-animations-skill | awwwards-animations |
| https://github.com/vercel-labs/agent-skills | web-design-guidelines, vercel-react-best-practices, vercel-react-view-transitions, vercel-composition-patterns |
| https://github.com/MengTo/Skills | build-awwwards-quality-sites |
| https://github.com/zubair-trabzada/scroll-cinematic-claude | scroll-cinematic |
| https://github.com/tsogjavklann/awwwards-3d | awwwards-3d |
| https://github.com/shadcn/ui | shadcn, migrate-radix-to-base |
| https://github.com/remotion-dev/skills | remotion-best-practices |

Reviewed on 2026-11-02 for unsafe scripts: the five shell scripts only check tools (ffmpeg,
shadcn setup) or report whether optional API keys are set, without printing them. Licences are
each project's own; check the source repository before reusing any of their files in the site.
Some scripts write working files to `.taste-skill/`, which is git-ignored.
