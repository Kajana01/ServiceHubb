const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Service = require('../models/Service');

// Sample services data
const sampleServices = [
  {
    name: 'Plumbing Repair',
    category: 'plumbing',
    description: 'Professional plumbing repair services including leak fixes, pipe repairs, faucet installation, and drain cleaning.',
    basePrice: 75,
    estimatedDuration: '2-4 hours',
    features: ['24/7 Emergency Service', 'Licensed Plumbers', 'Warranty Included'],
    requirements: ['Access to water shut-off', 'Clear work area']
  },
  {
    name: 'Electrical Installation',
    category: 'electrician',
    description: 'Complete electrical services including wiring, outlet installation, lighting setup, and electrical troubleshooting.',
    basePrice: 90,
    estimatedDuration: '3-5 hours',
    features: ['Certified Electricians', 'Safety Compliant', 'Code Adherence'],
    requirements: ['Power access', 'Clear work area']
  },
  {
    name: 'House Cleaning',
    category: 'cleaning',
    description: 'Comprehensive house cleaning services including deep cleaning, regular maintenance, and post-construction cleanup.',
    basePrice: 120,
    estimatedDuration: '4-6 hours',
    features: ['Eco-friendly Products', 'Professional Equipment', 'Satisfaction Guaranteed'],
    requirements: ['Access to all rooms', 'Cleaning supplies provided']
  },
  {
    name: 'Carpentry Work',
    category: 'carpentry',
    description: 'Custom carpentry services including furniture repair, cabinet installation, door fitting, and woodwork.',
    basePrice: 85,
    estimatedDuration: '3-6 hours',
    features: ['Custom Design', 'Quality Materials', 'Expert Craftsmanship'],
    requirements: ['Work space access', 'Material specifications']
  },
  {
    name: 'Interior Painting',
    category: 'painting',
    description: 'Professional interior painting services with color consultation, surface preparation, and clean application.',
    basePrice: 150,
    estimatedDuration: '6-8 hours',
    features: ['Color Consultation', 'Surface Prep', 'Clean Application'],
    requirements: ['Furniture moved', 'Ventilation access']
  },
  {
    name: 'Garden Maintenance',
    category: 'gardening',
    description: 'Complete garden care including landscaping, plant maintenance, irrigation, and seasonal cleanup.',
    basePrice: 65,
    estimatedDuration: '2-3 hours',
    features: ['Seasonal Care', 'Plant Health', 'Landscape Design'],
    requirements: ['Garden access', 'Water source']
  },
  {
    name: 'Appliance Repair',
    category: 'appliance_repair',
    description: 'Expert appliance repair services for refrigerators, washing machines, dishwashers, and other home appliances.',
    basePrice: 95,
    estimatedDuration: '2-4 hours',
    features: ['Same Day Service', 'Parts Warranty', 'Expert Technicians'],
    requirements: ['Appliance access', 'Model information']
  },
  {
    name: 'HVAC Service',
    category: 'other',
    description: 'Heating, ventilation, and air conditioning services including installation, repair, and maintenance.',
    basePrice: 110,
    estimatedDuration: '3-5 hours',
    features: ['24/7 Emergency', 'Energy Efficient', 'Professional Installation'],
    requirements: ['System access', 'Clear work area']
  },
  {
    name: 'Sri Lankan Home Maintenance',
    category: 'other',
    description: 'Complete home maintenance services tailored for Sri Lankan homes including roof repairs, water tank cleaning, and monsoon preparation.',
    basePrice: 80,
    estimatedDuration: '4-6 hours',
    features: ['Monsoon Preparation', 'Local Expertise', 'Affordable Rates'],
    requirements: ['Home access', 'Clear work area']
  },
  {
    name: 'Water Tank Cleaning',
    category: 'cleaning',
    description: 'Professional water tank cleaning and maintenance services to ensure clean drinking water for your family.',
    basePrice: 60,
    estimatedDuration: '2-3 hours',
    features: ['Safe Chemicals', 'Thorough Cleaning', 'Water Quality Check'],
    requirements: ['Tank access', 'Water shut-off']
  },
  {
    name: 'Generator Maintenance',
    category: 'appliance_repair',
    description: 'Generator servicing and maintenance for reliable power backup during Sri Lankan power cuts.',
    basePrice: 100,
    estimatedDuration: '2-4 hours',
    features: ['Power Cut Ready', 'Fuel Efficiency', 'Regular Maintenance'],
    requirements: ['Generator access', 'Clear work area']
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return seedServices();
  })
  .then(() => {
    console.log('Services seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding services:', error);
    process.exit(1);
  });

async function seedServices() {
  try {
    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');

    // Insert sample services
    const insertedServices = await Service.insertMany(sampleServices);
    console.log(`Inserted ${insertedServices.length} services`);

    // Display inserted services
    insertedServices.forEach(service => {
      console.log(`- ${service.name} (${service.category}): $${service.basePrice}`);
    });

  } catch (error) {
    console.error('Error in seedServices:', error);
    throw error;
  }
}













