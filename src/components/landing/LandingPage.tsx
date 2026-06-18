import Features from "./Features"
import Hero from "./Hero"
import HowItWorks from "./HowItWorks"

export default function LandingPage() {
    return (
        <div data-testid="landing-page" className="flex flex-col">
            <Hero />
            <Features />
            <HowItWorks />
        </div>
    )
}
