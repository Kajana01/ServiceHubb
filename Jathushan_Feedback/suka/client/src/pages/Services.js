import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaWrench, 
  FaBolt, 
  FaBroom, 
  FaHammer, 
  FaPaintBrush, 
  FaSeedling,
  FaArrowRight,
  FaStar
} from 'react-icons/fa';

const Services = () => {
  const { user } = useAuth();

  const services = [
    {
      id: 1,
      name: 'Plumbing Services',
      category: 'plumbing',
      description: 'Professional plumbing services including repairs, installations, and maintenance.',
      icon: FaWrench,
      price: 'From $50',
      rating: 4.8,
      reviews: 124,
      features: ['24/7 Emergency Service', 'Licensed Technicians', 'Warranty Included']
    },
    {
      id: 2,
      name: 'Electrical Services',
      category: 'electrician',
      description: 'Expert electrical work for residential and commercial properties.',
      icon: FaBolt,
      price: 'From $60',
      rating: 4.9,
      reviews: 98,
      features: ['Safety Certified', 'Code Compliant', 'Emergency Repairs']
    },
    {
      id: 3,
      name: 'Cleaning Services',
      category: 'cleaning',
      description: 'Comprehensive cleaning solutions for homes and offices.',
      icon: FaBroom,
      price: 'From $40',
      rating: 4.7,
      reviews: 156,
      features: ['Eco-friendly Products', 'Flexible Scheduling', 'Satisfaction Guaranteed']
    },
    {
      id: 4,
      name: 'Carpentry Services',
      category: 'carpentry',
      description: 'Custom woodwork and carpentry solutions for your home.',
      icon: FaHammer,
      price: 'From $70',
      rating: 4.6,
      reviews: 87,
      features: ['Custom Designs', 'Quality Materials', 'Professional Finish']
    },
    {
      id: 5,
      name: 'Painting Services',
      category: 'painting',
      description: 'Interior and exterior painting with premium quality materials.',
      icon: FaPaintBrush,
      price: 'From $45',
      rating: 4.8,
      reviews: 112,
      features: ['Color Consultation', 'Premium Paints', 'Clean Work Area']
    },
    {
      id: 6,
      name: 'Gardening Services',
      category: 'gardening',
      description: 'Landscaping and garden maintenance for beautiful outdoor spaces.',
      icon: FaSeedling,
      price: 'From $35',
      rating: 4.7,
      reviews: 93,
      features: ['Seasonal Maintenance', 'Plant Care', 'Design Services']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional home services delivered by verified technicians. 
            Quality workmanship guaranteed for every project.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service) => (
            <div key={service.id} className="card-hover group">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors duration-200">
                  <service.icon className="text-3xl text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(service.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {service.rating} ({service.reviews} reviews)
                </span>
              </div>

              {/* Features */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price and Action */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-primary-600">
                  {service.price}
                </span>
                {user ? (
                  <Link
                    to={`/book-service?category=${service.category}`}
                    className="btn-primary flex items-center space-x-2 group-hover:scale-105 transition-transform duration-200"
                  >
                    <span>Book Now</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="btn-primary flex items-center space-x-2 group-hover:scale-105 transition-transform duration-200"
                  >
                    <span>Get Started</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="card bg-gradient-to-r from-primary-600 to-accent-600 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-100 mb-6">
              Join thousands of satisfied customers who trust our professional services.
            </p>
            {user ? (
              <Link
                to="/book-service"
                className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Book Your Service
              </Link>
            ) : (
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
