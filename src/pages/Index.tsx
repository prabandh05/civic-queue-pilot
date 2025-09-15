import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Shield, Clock, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Shield className="h-4 w-4" />
              Government Digital Queue System
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Smart Queue Management
              <span className="block gradient-primary bg-clip-text text-transparent">
                for Government Offices
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Skip the chaos. Get your token online, track your position in real-time, 
              and receive notifications when it's your turn. Making government services 
              more efficient and citizen-friendly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/citizen">
                <Button size="lg" className="gap-2 px-8">
                  <Users className="h-5 w-5" />
                  Citizen Portal
                </Button>
              </Link>
              
              <Link to="/officer">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  <Shield className="h-5 w-5" />
                  Officer Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Queue System?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Designed specifically for government offices to reduce wait times and improve citizen experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Real-Time Updates</h3>
              <p className="text-sm text-muted-foreground">
                Get live notifications about your queue position and estimated wait times.
              </p>
            </Card>
            
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold">Fair Queue Management</h3>
              <p className="text-sm text-muted-foreground">
                40% online tokens, 60% walk-ins to ensure fairness for all citizens.
              </p>
            </Card>
            
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold">Secure & Verified</h3>
              <p className="text-sm text-muted-foreground">
                Aadhaar-based verification ensures authentic identity and prevents misuse.
              </p>
            </Card>
            
            <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold">Multi-Channel Support</h3>
              <p className="text-sm text-muted-foreground">
                Works on smartphones, kiosks, and display boards for all types of users.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Making a Difference</h2>
            <p className="text-muted-foreground">Real impact on government service delivery</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">75%</div>
              <div className="text-muted-foreground">Reduction in Wait Times</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">90%</div>
              <div className="text-muted-foreground">Citizen Satisfaction</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-success mb-2">50%</div>
              <div className="text-muted-foreground">Operational Efficiency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Government Queue Management System. Built for better citizen services.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
