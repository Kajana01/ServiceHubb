import React, { useState } from 'react';
import { 
  FaCreditCard, 
  FaUniversity, 
  FaMoneyBillWave,
  FaCheckCircle,
  FaLock,
  FaShieldAlt
} from 'react-icons/fa';

const PaymentMethodSelector = ({ selectedMethod, onMethodSelect, totalAmount }) => {
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      icon: FaCreditCard,
      description: 'Visa, Mastercard, American Express',
      color: 'blue',
      available: true
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: FaUniversity,
      description: 'Direct bank transfer',
      color: 'purple',
      available: true
    },
    {
      id: 'cash',
      name: 'Cash on Service',
      icon: FaMoneyBillWave,
      description: 'Pay when service is completed',
      color: 'green',
      available: true
    }
  ];

  const handleMethodSelect = (methodId) => {
    onMethodSelect(methodId);
    if (methodId === 'credit_card') {
      setShowCardDetails(true);
    } else {
      setShowCardDetails(false);
    }
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      // Format card number with spaces
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'expiryDate') {
      // Format expiry date as MM/YY
      const formatted = value.replace(/\D/g, '').replace(/(.{2})/, '$1/').substring(0, 5);
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'cvv') {
      // Limit CVV to 4 digits
      const formatted = value.replace(/\D/g, '').substring(0, 4);
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
      purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
    };
    return colorMap[color] || 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100';
  };

  const getSelectedColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-500 bg-blue-100 text-blue-800',
      green: 'border-green-500 bg-green-100 text-green-800',
      purple: 'border-purple-500 bg-purple-100 text-purple-800'
    };
    return colorMap[color] || 'border-gray-500 bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Payment Methods */}
      <div className="space-y-3">
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = selectedMethod === method.id;
          const baseClasses = "flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200";
          const colorClasses = isSelected 
            ? getSelectedColorClasses(method.color)
            : getColorClasses(method.color);
          
          return (
            <div
              key={method.id}
              onClick={() => method.available && handleMethodSelect(method.id)}
              className={`${baseClasses} ${colorClasses} ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <IconComponent className="w-6 h-6" />
                <div className="flex-1">
                  <h3 className="font-medium">{method.name}</h3>
                  <p className="text-sm opacity-75">{method.description}</p>
                </div>
                {isSelected && (
                  <FaCheckCircle className="w-5 h-5" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Card Details */}
      {showCardDetails && selectedMethod === 'credit_card' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center mb-4">
            <FaLock className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Secure Payment</span>
            <FaShieldAlt className="w-4 h-4 text-green-600 ml-2" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={cardDetails.cardNumber}
                onChange={handleCardInputChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className="input w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                name="expiryDate"
                value={cardDetails.expiryDate}
                onChange={handleCardInputChange}
                placeholder="MM/YY"
                maxLength="5"
                className="input w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleCardInputChange}
                placeholder="123"
                maxLength="4"
                className="input w-full"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={cardDetails.cardholderName}
                onChange={handleCardInputChange}
                placeholder="John Doe"
                className="input w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      {selectedMethod && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Payment Summary</h3>
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Total Amount:</span>
            <span className="font-semibold text-blue-900">LKR {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-blue-700">Payment Method:</span>
            <span className="text-blue-900">
              {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start space-x-2">
          <FaShieldAlt className="w-4 h-4 text-green-600 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Secure Payment</p>
            <p>Your payment information is encrypted and secure. We never store your card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
