import { ethers } from "ethers";
import Navbar from "./Navbar";
import { useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import Marketplace from '../Marketplace.json';
import { useLocation } from "react-router";
import bgform from '../formdes.jpeg';

export default function SellNFT() {
  // Wizard steps
  const steps = [
    'Project Details',
    'Carbon Validation',
    'Emission Calculation',
    'Fraud Detection',
    'Carbon Credit Listing'
  ];
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formParams, updateFormParams] = useState({ 
    name: '', 
    description: '', 
    price: '',
    // Carbon validation fields
    start_date: '',
    end_date: '',
    emission_reduction: '',
    project_size: '',
    successful_projects: '',
    total_projects: '',
    verification_score: '',
    risk_assessment: '',
    compliance_score: '',
    // Emission calculation fields
    emission_data: Array(10).fill().map(() => Array(13).fill(100)),
    // Fraud detection results
    fraud_score: null,
    validation_passed: false
  });
  
  const [fileURL, setFileURL] = useState(null);
  const [message, updateMessage] = useState('');
  const [validationResults, setValidationResults] = useState({
    carbon: null,
    emission: null,
    fraud: null
  });

  // Navigation functions
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Carbon validation API call
  const validateCarbonProject = async () => {
    try {
      updateMessage("Validating carbon project...");
      
      const response = await fetch('https://carbon-cred-val.onrender.com/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: formParams.start_date,
          end_date: formParams.end_date,
          emission_reduction: parseFloat(formParams.emission_reduction),
          project_size: formParams.project_size,
          successful_projects: parseInt(formParams.successful_projects),
          total_projects: parseInt(formParams.total_projects),
          verification_score: parseFloat(formParams.verification_score),
          risk_assessment: parseFloat(formParams.risk_assessment),
          compliance_score: parseFloat(formParams.compliance_score)
        })
      });

      const result = await response.json();
      setValidationResults(prev => ({
        ...prev,
        carbon: result.validation_score
      }));
      
      if (result.validation_score > 0.7) { // Threshold for passing
        nextStep();
        updateMessage("");
      } else {
        updateMessage(`Validation failed (Score: ${result.validation_score.toFixed(2)}. Minimum 0.7 required.`);
      }
    } catch (e) {
      updateMessage(`Validation error: ${e.message}`);
    }
  };

  // Emission calculation API call
  const calculateEmissions = async () => {
    try {
      updateMessage("Calculating emissions...");
      
      const response = await fetch('https://carbon-emmission-predictor.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequences: [formParams.emission_data]
        })
      });

      const result = await response.json();
      setValidationResults(prev => ({
        ...prev,
        emission: result.predictions[0]
      }));
      
      if (result.predictions[0] < 500) { // Example threshold
        nextStep();
        updateMessage("");
      } else {
        updateMessage(`High emissions detected (${result.predictions[0].toFixed(2)}). Consider mitigation strategies.`);
      }
    } catch (e) {
      updateMessage(`Calculation error: ${e.message}`);
    }
  };

  // Fraud detection API call
  const detectFraud = async () => {
    try {
      updateMessage("Running fraud detection...");
      
      // Prepare input data from all previous steps
      const fraudInput = [
        parseFloat(formParams.emission_reduction) / 1000,
        parseFloat(validationResults.carbon),
        parseFloat(validationResults.emission) / 1000,
        parseFloat(formParams.verification_score),
        parseFloat(formParams.risk_assessment),
        parseFloat(formParams.compliance_score),
        parseFloat(formParams.successful_projects) / parseFloat(formParams.total_projects)
      ];
      

      console.log(fraudInput);
      console.log("Sending payload:", JSON.stringify({ input: [fraudInput] }));

      const response = await fetch('https://fraud-detector-z9qi.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: [fraudInput]
        })
      });

      const result = await response.json();
      const fraudScore = result.predictions[0][0]; // Get first prediction score
      
      setValidationResults(prev => ({
        ...prev,
        fraud: fraudScore
      }));
      
      if (fraudScore < 0.3) { // Threshold for passing
        updateFormParams(prev => ({
          ...prev,
          validation_passed: true
        }));
        nextStep();
        updateMessage("");
      } else {
        updateMessage(`Potential fraud detected (Score: ${fraudScore.toFixed(2)}). Review project details.`);
      }
    } catch (e) {
      updateMessage(`Fraud detection error: ${e.message}`);
    }
  };

  // Handle emission data changes
  const handleEmissionDataChange = (rowIdx, colIdx, value) => {
    const newData = [...formParams.emission_data];
    newData[rowIdx][colIdx] = parseFloat(value) || 0;
    updateFormParams(prev => ({
      ...prev,
      emission_data: newData
    }));
  };

  // Render step content
  const renderStepContent = () => {
    switch(currentStep) {
      case 0: // Project Details
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-500 mb-6">Project Information</h3>
            <div>
              <label className="block text-green-500 text-sm font-bold mb-2">Project Name</label>
              <input className="w-full px-3 py-2 border rounded-md" 
                value={formParams.name}
                onChange={e => updateFormParams({...formParams, name: e.target.value})}
                placeholder="Carbon Reduction Project #001"
              />
            </div>
            <div>
              <label className="block text-green-500 text-sm font-bold mb-2">Number Of Carbon Credits</label>
              <textarea className="w-full px-3 py-2 border rounded-md" 
                value={formParams.description}
                onChange={e => updateFormParams({...formParams, description: e.target.value})}
                placeholder="Amount of credits you want to list"
              />
            </div>
            <div>
              <label className="block text-green-500 text-sm font-bold mb-2">Price (in ETH)</label>
              <input className="w-full px-3 py-2 border rounded-md" 
                type="number" 
                value={formParams.price}
                onChange={e => updateFormParams({...formParams, price: e.target.value})}
                placeholder="0.01"
                step="0.01"
              />
            </div>
          </div>
        );
      
      case 1: // Carbon Validation
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-500 mb-6">Carbon Credit Validation</h3>
            {validationResults.carbon && (
              <div className="p-3 bg-gray-800 rounded mb-4">
                <span className="font-bold">Validation Score:</span> {validationResults.carbon.toFixed(2)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Start Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded-md"
                  value={formParams.start_date}
                  onChange={e => updateFormParams({...formParams, start_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">End Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded-md"
                  value={formParams.end_date}
                  onChange={e => updateFormParams({...formParams, end_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Emission Reduction (tons)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md"
                  value={formParams.emission_reduction}
                  onChange={e => updateFormParams({...formParams, emission_reduction: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Project Size</label>
                <select className="w-full px-3 py-2 border rounded-md"
                  value={formParams.project_size}
                  onChange={e => updateFormParams({...formParams, project_size: e.target.value})}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Successful Projects</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md"
                  value={formParams.successful_projects}
                  onChange={e => updateFormParams({...formParams, successful_projects: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Total Projects</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md"
                  value={formParams.total_projects}
                  onChange={e => updateFormParams({...formParams, total_projects: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Verification Score (0-1)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md"
                  min="0" max="1" step="0.01"
                  value={formParams.verification_score}
                  onChange={e => updateFormParams({...formParams, verification_score: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Risk Assessment (0-1)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md"
                  min="0" max="1" step="0.01"
                  value={formParams.risk_assessment}
                  onChange={e => updateFormParams({...formParams, risk_assessment: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-green-500 text-sm font-bold mb-2">Compliance Score (0-1)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-md"
                  min="0" max="1" step="0.01"
                  value={formParams.compliance_score}
                  onChange={e => updateFormParams({...formParams, compliance_score: e.target.value})}
                />
              </div>
            </div>
          </div>
        );
      
      case 2: // Emission Calculation
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-500 mb-6">Emission Calculation</h3>
            {validationResults.emission !== null && (
              <div className="p-3 bg-gray-800 rounded mb-4">
                <span className="font-bold">Predicted CO₂ Emission:</span> {validationResults.emission.toFixed(2)} tons
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-2 border">Time Step</th>
                    <th className="p-2 border">Industrial Output</th>
                    <th className="p-2 border">Energy Consumption</th>
                    <th className="p-2 border">Transport Emissions</th>
                    <th className="p-2 border">Population Density</th>
                    <th className="p-2 border">Temperature</th>
                    <th className="p-2 border">Humidity</th>
                    <th className="p-2 border">Renewable Energy</th>
                    <th className="p-2 border">Carbon Tax</th>
                    <th className="p-2 border">Energy Efficiency</th>
                    <th className="p-2 border">Traffic Index</th>
                    <th className="p-2 border">Forest Cover</th>
                    <th className="p-2 border">Industrial Waste</th>
                    <th className="p-2 border">Urbanization Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {formParams.emission_data.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className="p-2 border">{rowIdx + 1}</td>
                      {row.map((value, colIdx) => (
                        <td key={colIdx} className="p-2 border">
                          <input
                            type="number"
                            className="w-full bg-transparent text-center"
                            value={value}
                            onChange={e => handleEmissionDataChange(rowIdx, colIdx, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              className="mt-4 px-4 py-2 bg-gray-700 rounded"
              onClick={() => {
                // Fill with random data
                const newData = formParams.emission_data.map(row => 
                  row.map(() => Math.floor(Math.random() * 200))
                );
                updateFormParams({...formParams, emission_data: newData});
              }}
            >
              Fill Random Data
            </button>
          </div>
        );
      
      case 3: // Fraud Detection
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-500 mb-6">Fraud Detection</h3>
            <div className="p-4 bg-gray-800 rounded">
              <h4 className="font-bold mb-2">Validation Summary:</h4>
              <ul className="space-y-2">
                <li>Carbon Validation Score: {validationResults.carbon?.toFixed(2) || 'Pending'}</li>
                <li>Predicted Emissions: {validationResults.emission?.toFixed(2) || 'Pending'} tons</li>
              </ul>
            </div>
            {validationResults.fraud !== null && (
              <div className={`p-3 rounded mb-4 ${
                validationResults.fraud < 0.3 ? 'bg-green-900' : 'bg-red-900'
              }`}>
                <span className="font-bold">Fraud Detection Score:</span> {validationResults.fraud.toFixed(2)}
                {validationResults.fraud < 0.3 ? (
                  <span className="ml-2">✅ Passed</span>
                ) : (
                  <span className="ml-2">❌ Failed</span>
                )}
              </div>
            )}
            <div className="p-4 bg-gray-800 rounded">
              <p className="mb-2">This step analyzes all provided data for potential fraud patterns.</p>
              <p>If the score is below 0.3, your project will be approved for listing.</p>
            </div>
          </div>
        );
      
      case 4: // NFT Listing
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-500 mb-6">Carbon Credit Listing</h3>
            {!formParams.validation_passed ? (
              <div className="p-4 bg-red-900 rounded">
                <p>Project validation failed. Please review your project details.</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-green-900 rounded mb-4">
                  <p>✅ Project validated successfully! You can now list your carbon credit NFT.</p>
                </div>
                <div>
                  <label className="block text-green-500 text-sm font-bold mb-2">Upload Project Image</label>
                  <input 
                    type="file" 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      try {
                        updateMessage("Uploading image...");
                        const response = await uploadFileToIPFS(file);
                        if (response.success) {
                          setFileURL(response.pinataURL);
                          updateMessage("Image uploaded successfully!");
                        }
                      } catch (error) {
                        updateMessage(`Error uploading image: ${error.message}`);
                      }
                    }}
                  />
                </div>
                <div className="pt-4">
                  <h4 className="font-bold mb-2">Final Project Details:</h4>
                  <ul className="space-y-1">
                    <li>Name: {formParams.name}</li>
                    <li>Price: {formParams.price} ETH</li>
                    <li>Emission Reduction: {formParams.emission_reduction} tons</li>
                    <li>Validation Score: {validationResults.carbon?.toFixed(2)}</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Final NFT listing function
  const listNFT = async (e) => {
    e.preventDefault();
    try {
      if (!formParams.validation_passed) {
        throw new Error("Project validation failed");
      }
      if (!fileURL) {
        throw new Error("Please upload an image");
      }

      updateMessage("Creating NFT metadata...");
      const metadataURL = await uploadMetadataToIPFS();

      updateMessage("Initializing blockchain transaction...");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer);
      
      const price = ethers.utils.parseUnits(formParams.price, 'ether');
      let listingPrice = await contract.getListPrice();
      listingPrice = listingPrice.toString();

      updateMessage("Confirm transaction in your wallet...");
      const transaction = await contract.createToken(metadataURL, price, { value: listingPrice });
      
      updateMessage("Processing transaction...");
      await transaction.wait();

      alert("NFT listed successfully!");
      updateMessage("");
      // Reset form
      updateFormParams({
        name: '', 
        description: '', 
        price: '',
        start_date: '',
        end_date: '',
        emission_reduction: '',
        project_size: '',
        successful_projects: '',
        total_projects: '',
        verification_score: '',
        risk_assessment: '',
        compliance_score: '',
        emission_data: Array(10).fill().map(() => Array(13).fill(100)),
        fraud_score: null,
        validation_passed: false
      });
      setFileURL(null);
      setValidationResults({
        carbon: null,
        emission: null,
        fraud: null
      });
      setCurrentStep(0);
    } catch (e) {
      updateMessage(`Error: ${e.message}`);
    }
  };

  const uploadMetadataToIPFS = async () => {
    const { name, description, price } = formParams;
    if (!name || !description || !price || !fileURL) {
      throw new Error("Missing required fields");
    }

    const nftJSON = {
      name,
      description,
      price,
      image: fileURL,
      attributes: [
        {
          trait_type: "Carbon Validation Score",
          value: validationResults.carbon.toFixed(2)
        },
        {
          trait_type: "Emission Reduction",
          value: formParams.emission_reduction
        },
        {
          trait_type: "Fraud Detection Score",
          value: validationResults.fraud.toFixed(2)
        }
      ]
    };

    const response = await uploadJSONToIPFS(nftJSON);
    if (response.success) {
      return response.pinataURL;
    } else {
      throw new Error("Failed to upload metadata");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        {/* Step indicator */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div 
              key={step}
              className={`flex-1 text-center pb-2 ${index <= currentStep ? 'border-b-2 border-green-500' : 'border-b border-gray-600'}`}
            >
              <span className={`text-sm ${index <= currentStep ? 'text-green-500' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-gray-900 p-6 rounded-lg">
          {renderStepContent()}
          
          {/* Message display */}
          {message && (
            <div className="mt-4 p-3 bg-gray-800 rounded text-center">
              {message}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            className={`px-4 py-2 rounded ${currentStep === 0 ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}`}
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Back
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
              onClick={() => {
                if (currentStep === 1) validateCarbonProject();
                else if (currentStep === 2) calculateEmissions();
                else if (currentStep === 3) detectFraud();
                else nextStep();
              }}
            >
              {currentStep === 3 ? 'Validate & Continue' : 'Continue'}
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
              onClick={listNFT}
              disabled={!formParams.validation_passed || !fileURL}
            >
              List Credits
            </button>
          )}
        </div>
      </div>
    </div>
  );
}