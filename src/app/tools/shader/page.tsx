import type { Metadata } from "next";
import ShaderPlayground from "~/components/ShaderPlayground";

export const metadata: Metadata = {
  title: "Shader Playground",
  description:
    "Write, preview, and export GLSL fragment shaders with real-time WebGL preview. A creative coding tool for shader development.",
  alternates: {
    canonical: "/tools/shader",
  },
  openGraph: {
    title: "Shader Playground | Nick Kuek",
    description:
      "Write, preview, and export GLSL fragment shaders with real-time WebGL preview. A creative coding tool for shader development.",
  },
  twitter: {
    title: "Shader Playground | Nick Kuek",
    description:
      "Write, preview, and export GLSL fragment shaders with real-time WebGL preview. A creative coding tool for shader development.",
  },
};

export default function ShaderPage() {
  return <ShaderPlayground />;
}
