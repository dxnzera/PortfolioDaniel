export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  link?: string;
  source?: string;
  video?: string;
  poster?: string;
  accent: string;
  year?: string;
};

export const projects: Project[] = [
  {
    id: "deskclub",
    title: "Deskclub",
    description: "Marketplace para compra e venda de hardware e periféricos.",
    category: "Hardware · Marketplace",
    technologies: [],
    link: "https://deskclub-one.vercel.app",
    video: "/videos/deskclub.mp4",
    poster: "/images/deskclub.webp",
    accent: "#cad0bd",
  },
  {
    id: "nitefy",
    title: "Nitefy",
    description: "Sistema de ingressos para eventos de vida noturna.",
    category: "Vida noturna · Ingressos",
    technologies: [],
    link: "https://nitefy.app",
    video: "/videos/nitefy.mp4",
    poster: "/images/nitefy.webp",
    accent: "#ac92c4",
  },
  {
    id: "scenr",
    title: "Scenr",
    description: "Aplicativo web para consultar filmes, elencos e onde assistir.",
    category: "Cinema · Experiência web",
    technologies: ["React", "TypeScript", "Tailwind CSS"],
    link: "https://dxnzera.github.io/Scenr/#/",
    source: "https://github.com/dxnzera/Scenr",
    video: "/videos/scenr.mp4",
    poster: "/images/scenr.webp",
    accent: "#b72c25",
  },
  {
    id: "lanche",
    title: "Lanchê",
    description: "Landing page de uma marca de refeições para pessoas com restrições alimentares.",
    category: "Identidade · Landing page",
    technologies: ["React", "TypeScript", "Tailwind CSS"],
    link: "https://dxnzera.github.io/lanche/",
    source: "https://github.com/dxnzera/lanche",
    video: "/videos/lanche.mp4",
    poster: "/images/lanche.webp",
    accent: "#d4b13f",
  },
  {
    id: "xis",
    title: "XiS Tickets",
    description: "Aplicativo iOS para descobrir eventos e gerenciar ingressos.",
    category: "Eventos · Aplicativo iOS",
    technologies: ["Swift", "SwiftUI", "Combine"],
    source: "https://github.com/dxnzera/XIS-Tickets",
    video: "/videos/xis.mp4",
    poster: "/images/xis.webp",
    accent: "#7e86a8",
  },
];
