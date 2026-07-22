import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Estelamaris",
    short_name: "Estelamaris",
    description: "Programa de Pontos e Fidelidade Estelamaris",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#E4282B",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
