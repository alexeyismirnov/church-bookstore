import Image from 'next/image';
import { BookOpen, Heart, Users, Globe } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: BookOpen,
      title: 'Orthodox Tradition',
      description: 'We are committed to preserving and sharing the rich literary heritage of Orthodox Christianity.',
    },
    {
      icon: Heart,
      title: 'Spiritual Growth',
      description: 'Our mission is to support your spiritual journey with carefully selected resources.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We serve our parish community and Orthodox Christians worldwide.',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'We ship to Orthodox communities around the world, spreading the faith through literature.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-dark text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About Our Bookstore</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Serving the Orthodox community with quality books and spiritual resources since 2010
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title">Our Mission</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Our bookstore was founded with a simple yet profound mission: to make Orthodox Christian 
                literature accessible to all who seek spiritual nourishment. We believe that the written 
                word is a powerful tool for transmitting the wisdom of the Holy Fathers and the 
                teachings of the Church.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Every book in our catalog has been carefully selected to ensure it aligns with Orthodox 
                teaching and can contribute to the spiritual growth of our readers. From prayer books 
                and liturgical texts to lives of saints and theological studies, we offer resources 
                for every stage of the spiritual journey.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Proceeds from our bookstore support the ministries of our parish, including religious 
                education, charitable works, and the maintenance of our sacred temple.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/products/2013/09/9789881889508.jpg"
                  alt="Orthodox Books"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-dark mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/church_logo.jpg"
                  alt="Church Logo"
                  className="w-full h-full object-contain bg-white p-8"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="section-title">Our History</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                What began as a small table of books after Sunday Liturgy has grown into a full-service 
                bookstore serving Orthodox Christians worldwide. Our journey started in 2010 when our 
                priest, seeing the need for accessible Orthodox literature, began offering books to 
                parishioners.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Over the years, we have expanded our collection to include over 500 titles from Orthodox 
                publishers around the world. We have been blessed to serve monasteries, parishes, 
                schools, and individual seekers across the globe.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Today, we continue this sacred work with the same dedication and love that inspired 
                our founding. We remain committed to our original mission: making the treasures of 
                Orthodox Christianity available to all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">500+</p>
              <p className="text-gray-300">Books Available</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">50+</p>
              <p className="text-gray-300">Countries Served</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">15+</p>
              <p className="text-gray-300">Years of Service</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">10k+</p>
              <p className="text-gray-300">Happy Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">Our Team</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            Our dedicated team of volunteers and staff work together to serve you with love and dedication.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Fr. John Smith',
                role: 'Founder & Spiritual Advisor',
                image: '/images/products/2013/10/ArchimIoann.jpg',
              },
              {
                name: 'Maria Johnson',
                role: 'Store Manager',
                image: '/images/products/2014/07/maria1.jpg',
              },
              {
                name: 'Peter Davis',
                role: 'Customer Service',
                image: '/images/products/2017/03/palladii.jpg',
              },
            ].map((member) => (
              <div key={member.name} className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-dark">{member.name}</h3>
                <p className="text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
