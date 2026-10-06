import Navigation from "@/components/navigation/Navigation";
import Hero from "@/components/hero/Hero";
import ProjectGallery from "@/components/projects/ProjectGallery";
import Contact from "@/components/contact/Contact";
import MotionDirector from "@/components/transitions/MotionDirector";
import Cursor from "@/components/ui/Cursor";
import AmbientSurface from "@/components/background/AmbientSurface";

export default function Home() {
  return (
    <>
      <AmbientSurface />
      <a className="skip-link" href="#main">Pular para o conteúdo</a>
      <Navigation />
      <main id="main">
        <Hero />
        <ProjectGallery />
        <Contact />
      </main>
      <MotionDirector />
      <Cursor />
    </>
  );
}
