import * as THREE from "three/webgpu";
import {
  Canvas,
  CanvasProps,
  extend,
  ThreeToJSXElements,
} from "@react-three/fiber";

declare module "@react-three/fiber" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);

export default function WebGPUCanvas({
  children,
  ...props
}: Omit<CanvasProps, "gl">) {
  return (
    <Canvas
      gl={async (props) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderer = new THREE.WebGPURenderer(props as any);
        await renderer.init();
        renderer.alpha = true; // Enable alpha for transparency
        return renderer;
      }}
      {...props}
    >
      {children}
    </Canvas>
  );
}
