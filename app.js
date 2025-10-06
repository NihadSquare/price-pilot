import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings,
  Calculator,
  Save,
  Trash2,
  List,
  Plus,
  Minus,
  AlertTriangle,
  Zap,
  Loader,
  X,
  Menu,
  DollarSign,
  Key
} from 'lucide-react';

// Firebase imports with error handling
let firebaseInitialized = false;
let db, auth;

try {
  if (typeof initializeApp !== 'undefined') {
    const { initializeApp } = require('firebase/app');
    const { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } = require('firebase/auth');
    const { 
      getFirestore, doc, collection, query, onSnapshot, setDoc, deleteDoc, 
      serverTimestamp, runTransaction 
    } = require('firebase/firestore');
    
    // Initialize Firebase if config is available
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      const firebaseConfig = JSON.parse(__firebase_config);
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      firebaseInitialized = true;
    }
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error);
}

// --- Global Constants and Utilities ---

const CURRENCIES = [
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'BDT', symbol: '৳', name: 'Bangladesi Taka' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'COP', symbol: 'COP$', name: 'Colombian Peso' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'DKK', symbol: 'kr.', name: 'Danish Krone' },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna (Retired)' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'RSD', symbol: 'дин', name: 'Serbian Dinar' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Đồng' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
].sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_CURRENCY_CODE = 'USD';

const initialRecipeState = {
  id: '',
  name: 'New Recipe',
  batchYield: 10,
  laborCostPerHour: 20,
  laborTimeHours: 0.5,
  overheadPercentage: 0.15, // 15% of total direct cost
  desiredRetailMargin: 0.5, // 50%
  desiredWholesaleMargin: 0.3, // 30%
  ingredients: [
    { id: 'i1', name: 'All-Purpose Flour', quantity: 500, unit: 'g', costPerUnit: 0.003 },
    { id: 'i2', name: 'Granulated Sugar', quantity: 200, unit: 'g', costPerUnit: 0.005 },
  ],
  packaging: [
    { id: 'p1', name: 'Product Box', costPerUnit: 0.50 },
    { id: 'p2', name: 'Label', costPerUnit: 0.10 },
  ],
};

const formatCurrency = (amount, currencyCode) => {
  const currencyInfo = CURRENCIES.find(c => c.code === currencyCode) || { symbol: '$', code: 'USD' };
  const safeAmount = Number(amount) || 0;
  return `${currencyInfo.symbol}${safeAmount.toFixed(2)}`;
};

const calculateCosts = (recipe) => {
  // Safely parse numbers to avoid NaN
  const safeRecipe = {
    ...recipe,
    batchYield: Math.max(1, Number(recipe.batchYield) || 1),
    laborCostPerHour: Number(recipe.laborCostPerHour) || 0,
    laborTimeHours: Number(recipe.laborTimeHours) || 0,
    overheadPercentage: Number(recipe.overheadPercentage) || 0,
  };

  // A. Direct Costs
  const ingredientCost = safeRecipe.ingredients.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const costPerUnit = Number(item.costPerUnit) || 0;
    return sum + (quantity * costPerUnit);
  }, 0);
  
  // Packaging cost is applied once per unit in the batch
  const packagingCostPerUnit = safeRecipe.packaging.reduce((sum, item) => {
    return sum + (Number(item.costPerUnit) || 0);
  }, 0);
  const totalPackagingCost = packagingCostPerUnit * safeRecipe.batchYield;
  
  const totalDirectCost = ingredientCost + totalPackagingCost;

  // B. Labor Cost
  const laborCost = safeRecipe.laborCostPerHour * safeRecipe.laborTimeHours;

  // C. Overhead Cost (applied to all direct costs)
  const overheadCost = totalDirectCost * safeRecipe.overheadPercentage;
  
  // D. Total Batch Cost
  const totalBatchCost = totalDirectCost + laborCost + overheadCost;

  // E. Cost Per Unit
  const costPerUnit = totalBatchCost / safeRecipe.batchYield;

  // F. Suggested Pricing
  // Price = Cost / (1 - Margin)
  const retailMargin = Number(recipe.desiredRetailMargin) || 0;
  const wholesaleMargin = Number(recipe.desiredWholesaleMargin) || 0;
  
  const retailPrice = retailMargin >= 1 ? costPerUnit * 2 : costPerUnit / (1 - Math.min(0.95, retailMargin));
  const wholesalePrice = wholesaleMargin >= 1 ? costPerUnit * 1.5 : costPerUnit / (1 - Math.min(0.95, wholesaleMargin));

  return {
    ingredientCost,
    packagingCost: totalPackagingCost,
    laborCost,
    overheadCost,
    totalDirectCost,
    totalBatchCost,
    costPerUnit,
    retailPrice,
    wholesalePrice,
  };
};

/**
 * Calls the Gemini API to get suggested ingredients and costs for a given recipe name.
 */
const callGeminiAI = async (recipeName, apiKey) => {
  // Use the provided API key or try to get from localStorage
  const finalApiKey = apiKey || localStorage.getItem('gemini_api_key') || "";
  
  if (!finalApiKey) {
    throw new Error("API key not found. Please add your Gemini API key in the settings.");
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${finalApiKey}`;
  
  const userQuery = `Generate a realistic ingredient list for a batch of the following food product: ${recipeName}. For each ingredient, estimate a common purchase quantity, the unit of measure (e.g., 'g', 'ml', 'unit'), and a realistic current market cost per unit in USD for a small business. Do not include packaging costs.`;
  
  const systemPrompt = "You are a professional food cost estimator and recipe development assistant. Your task is to provide a comprehensive, realistic list of ingredients and their estimated costs and quantities for a batch of the requested food item. You must respond ONLY with a JSON array that strictly conforms to the provided schema.";

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    tools: [{ "google_search": {} }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            "name": { "type": "STRING", "description": "The name of the ingredient, e.g., 'All-Purpose Flour'." },
            "quantity": { "type": "NUMBER", "description": "The quantity of this ingredient needed for the batch." },
            "unit": { "type": "STRING", "description": "The unit of measurement for the quantity, e.g., 'g', 'ml', 'oz', 'cup'." },
            "costPerUnit": { "type": "NUMBER", "description": "The estimated cost in USD per single unit (e.g., cost per gram, cost per ml, cost per teaspoon)." }
          },
          required: ["name", "quantity", "unit", "costPerUnit"]
        }
      }
    }
  };

  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`Authentication Error (401): Invalid API key. Please check your Gemini API key.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (jsonText) {
        try {
          const parsedJson = JSON.parse(jsonText);
          return Array.isArray(parsedJson) ? parsedJson : [];
        } catch (parseError) {
          console.error("Failed to parse AI response JSON:", parseError);
          throw new Error("Invalid JSON structure returned by AI.");
        }
      } else {
        return [];
      }

    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        console.error("Gemini API call failed after multiple retries:", error);
        throw new Error(`Failed to get AI suggestions: ${error.message}`);
      }

      const delay = 1000 * Math.pow(2, attempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return [];
};

// --- Firebase Setup and Hooks ---

const useAuth = () => {
  const [userId, setUserId] = useState(null);
  const [displayId, setDisplayId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!firebaseInitialized || !auth) {
      setUserId(null); 
      setDisplayId(crypto.randomUUID());
      setIsAuthReady(true);
      return;
    }

    const signIn = async () => {
      try {
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth Error during sign-in:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); 
        setDisplayId(user.uid);
      } else {
        setUserId(null); 
        setDisplayId(crypto.randomUUID()); 
      }
      setIsAuthReady(true);
    });

    signIn();
    return () => unsubscribe();
  }, []);

  return { userId, isAuthReady, displayId };
};

const useFirestore = (collectionPath, isAuthReady, userId) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!firebaseInitialized || !db || !isAuthReady || !userId) {
      setData([]);
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', collectionPath);
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
    }, (error) => {
      console.error("Firestore Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, collectionPath, userId]);

  return data;
};

// --- Main App Component ---

const App = () => {
  const { userId, isAuthReady, displayId } = useAuth();
  const storedRecipes = useFirestore('recipes', isAuthReady, userId);

  const [recipes, setRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(initialRecipeState);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY_CODE);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showRecipeList, setShowRecipeList] = useState(true);
  const [message, setMessage] = useState('');

  // Load settings from local storage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('appCurrency');
    const savedApiKey = localStorage.getItem('gemini_api_key');
    
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Update local recipe state from Firestore when ready
  useEffect(() => {
    if (isAuthReady) {
      setRecipes(storedRecipes);
      if (storedRecipes.length > 0 && currentRecipe.id === '') {
        const latestRecipe = storedRecipes.reduce((latest, current) => {
          const latestTime = latest.updatedAt?.toMillis() || 0;
          const currentTime = current.updatedAt?.toMillis() || 0;
          return currentTime > latestTime ? current : latest;
        }, storedRecipes[0]); 
        
        loadRecipe(latestRecipe);
      }
    }
  }, [storedRecipes, isAuthReady]);

  // --- Handlers for Recipe Data ---

  const handleFieldChange = (key, value) => {
    setCurrentRecipe(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayChange = (type, id, key, value) => {
    setCurrentRecipe(prev => ({
      ...prev,
      [type]: prev[type].map(item => 
        item.id === id ? { ...item, [key]: value } : item
      )
    }));
  };

  const addItem = (type) => {
    const newItem = type === 'ingredients' 
      ? { id: crypto.randomUUID(), name: '', quantity: 0, unit: 'g', costPerUnit: 0 }
      : { id: crypto.randomUUID(), name: '', costPerUnit: 0 };
    setCurrentRecipe(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const removeItem = (type, id) => {
    setCurrentRecipe(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
  };

  // --- Firestore CRUD ---

  const saveRecipe = async () => {
    if (!firebaseInitialized || !db || !userId) {
      setMessage("Cannot save: Firebase not configured or authentication failed.");
      return;
    }
    
    if (!currentRecipe.name?.trim()) {
      setMessage("Recipe name cannot be empty.");
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const recipeId = currentRecipe.id || crypto.randomUUID();
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'recipes', recipeId);
      
      const recipeToSave = {
        ...currentRecipe,
        userId: userId,
        id: recipeId,
        updatedAt: serverTimestamp(),
        batchYield: Number(currentRecipe.batchYield) || 1,
        laborCostPerHour: Number(currentRecipe.laborCostPerHour) || 0,
        laborTimeHours: Number(currentRecipe.laborTimeHours) || 0,
        overheadPercentage: Number(currentRecipe.overheadPercentage) || 0,
        desiredRetailMargin: Number(currentRecipe.desiredRetailMargin) || 0,
        desiredWholesaleMargin: Number(currentRecipe.desiredWholesaleMargin) || 0,
        ingredients: currentRecipe.ingredients.map(i => ({
          ...i, 
          costPerUnit: Number(i.costPerUnit) || 0, 
          quantity: Number(i.quantity) || 0
        })),
        packaging: currentRecipe.packaging.map(p => ({
          ...p, 
          costPerUnit: Number(p.costPerUnit) || 0
        })),
      };

      await setDoc(docRef, recipeToSave);
      setCurrentRecipe(prev => ({ ...prev, id: recipeId }));
      setMessage(`Recipe '${recipeToSave.name}' saved successfully!`);
    } catch (error) {
      console.error("Error saving recipe:", error);
      setMessage("Error saving recipe. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipe = (recipe) => {
    const loadedRecipe = {
      ...recipe,
      batchYield: Number(recipe.batchYield) || 1,
      laborCostPerHour: Number(recipe.laborCostPerHour) || 0,
      laborTimeHours: Number(recipe.laborTimeHours) || 0,
      overheadPercentage: Number(recipe.overheadPercentage) || 0,
      desiredRetailMargin: Number(recipe.desiredRetailMargin) || 0,
      desiredWholesaleMargin: Number(recipe.desiredWholesaleMargin) || 0,
      ingredients: recipe.ingredients.map(i => ({
        ...i, 
        costPerUnit: Number(i.costPerUnit) || 0, 
        quantity: Number(i.quantity) || 0
      })),
      packaging: recipe.packaging.map(p => ({
        ...p, 
        costPerUnit: Number(p.costPerUnit) || 0
      })),
    };
    setCurrentRecipe(loadedRecipe);
    setShowRecipeList(false);
    setMessage(`Recipe '${recipe.name}' loaded.`);
  };

  const deleteRecipe = async (id, name) => {
    if (!firebaseInitialized || !db) return;
    
    if (window.confirm(`Are you sure you want to delete the recipe: ${name}?`)) {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'recipes', id);
        await deleteDoc(docRef);
        setMessage(`Recipe '${name}' deleted successfully.`);
        if (currentRecipe.id === id) {
          setCurrentRecipe(initialRecipeState);
          setShowRecipeList(true);
        }
      } catch (error) {
        console.error("Error deleting recipe:", error);
        setMessage("Error deleting recipe. Check console for details.");
      }
    }
  };

  const newRecipe = () => {
    setCurrentRecipe({ ...initialRecipeState, id: '' });
    setShowRecipeList(false);
    setMessage('Started a new recipe calculation.');
  };

  // --- AI Suggestion Handler ---

  const handleAiSuggestion = async () => {
    if (!aiPrompt.trim()) {
      setMessage("Please enter a recipe name to get suggestions.");
      return;
    }
    
    setLoading(true);
    setMessage(`Searching for ingredients for '${aiPrompt}'...`);

    try {
      const suggestions = await callGeminiAI(aiPrompt, apiKey);
      if (suggestions && suggestions.length > 0) {
        const newIngredients = suggestions.map(ing => ({
          id: crypto.randomUUID(),
          name: ing.name || 'Unknown Ingredient',
          quantity: Number(ing.quantity) || 0,
          unit: ing.unit || 'g',
          costPerUnit: Number(ing.costPerUnit) || 0,
        }));
        
        setCurrentRecipe(prev => ({
          ...prev,
          name: aiPrompt,
          ingredients: newIngredients,
          packaging: initialRecipeState.packaging,
          batchYield: 12,
        }));

        setMessage(`AI suggested ${newIngredients.length} ingredients for '${aiPrompt}'. Review costs and quantities!`);
      } else {
        setMessage(`AI could not find suggestions for '${aiPrompt}'. Please add ingredients manually.`);
      }
    } catch (error) {
      console.error("AI Suggestion Fetch Error:", error);
      setMessage("An error occurred while fetching AI suggestions. Please try again. Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Settings Handlers ---

  const selectCurrency = (code) => {
    setCurrency(code);
    localStorage.setItem('appCurrency', code);
    setMessage(`Currency set to ${code}.`);
  };

  const handleApiKeyChange = (newApiKey) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini_api_key', newApiKey);
  };

  const saveSettings = () => {
    localStorage.setItem('appCurrency', currency);
    localStorage.setItem('gemini_api_key', apiKey);
    setShowSettings(false);
    setMessage('Settings saved successfully!');
  };

  // --- Core Calculation ---

  const costs = useMemo(() => calculateCosts(currentRecipe), [currentRecipe]);

  // --- Utility Components ---

  const SettingsModal = ({ 
    isVisible, 
    onClose, 
    currentCurrency, 
    onSelectCurrency, 
    apiKey, 
    onApiKeyChange,
    onSave 
  }) => {
    if (!isVisible) return null;
    const currencyInfo = CURRENCIES.find(c => c.code === currentCurrency);

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex justify-between items-center">
              Application Settings
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </h3>
          </div>
          
          <div className="p-5 space-y-6">
            {/* Currency Settings */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                Currency Settings
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Currently set to: <span className="font-semibold">{currencyInfo?.name} ({currencyInfo?.code})</span>
              </p>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Currency:
                </label>
                <select
                  value={currentCurrency}
                  onChange={(e) => onSelectCurrency(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.code}) - {currency.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* API Key Settings */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-yellow-500" />
                Gemini API Key
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your Google Gemini API key to enable AI ingredient suggestions.
              </p>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key:
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your API key is stored locally in your browser and never shared with us.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InputField = ({ label, value, onChange, type = 'text', unit = '', min = 0, step = 'any', placeholder = '' }) => (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex items-center">
        <input
          type={type}
          value={value}
          onChange={e => onChange(type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
          min={min}
          step={step}
          placeholder={placeholder}
          className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        {unit && <span className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-r-lg text-sm">{unit}</span>}
      </div>
    </div>
  );

  const CostTable = ({ items, type, onRemove, onUpdate, currencyCode, formatCurrency }) => (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{type === 'ingredients' ? 'Ingredients' : 'Packaging'}</h4>
      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">Name</th>
              {type === 'ingredients' && (
                <>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">Qty/Unit</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">Unit Cost ({formatCurrency(0, currencyCode).replace('0.00', '')})</th>
                </>
              )}
              {type === 'packaging' && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/2">Cost per Unit ({formatCurrency(0, currencyCode).replace('0.00', '')})</th>
              )}
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="p-3 whitespace-nowrap">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => onUpdate(item.id, 'name', e.target.value)}
                    className="w-full p-1 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Flour"
                  />
                </td>
                {type === 'ingredients' && (
                  <>
                    <td className="p-3 flex space-x-1">
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={e => onUpdate(item.id, 'quantity', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0"
                            step="any"
                            className="w-1/2 p-1 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <input
                            type="text"
                            value={item.unit}
                            onChange={e => onUpdate(item.id, 'unit', e.target.value)}
                            className="w-1/2 p-1 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                            placeholder="g / ml"
                        />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.costPerUnit}
                        onChange={e => onUpdate(item.id, 'costPerUnit', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        min="0"
                        step="any"
                        className="w-full p-1 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </td>
                  </>
                )}
                {type === 'packaging' && (
                  <td className="p-3 whitespace-nowrap">
                    <input
                      type="number"
                      value={item.costPerUnit}
                      onChange={e => onUpdate(item.id, 'costPerUnit', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      step="any"
                      className="w-full p-1 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </td>
                )}
                <td className="p-3 text-center">
                  <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900">
                    <Minus className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => addItem(type)}
        className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition duration-150"
      >
        <Plus className="w-4 h-4 mr-1" /> Add {type === 'ingredients' ? 'Ingredient' : 'Packaging Item'}
      </button>
    </div>
  );

  const CostSummaryCard = ({ label, value, colorClass = 'text-green-600 dark:text-green-400' }) => (
    <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClass}`}>
        {formatCurrency(value, currency)}
      </p>
    </div>
  );

  const PricingCard = ({ title, cost, margin, onMarginChange, colorClass, baseCost }) => (
    <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg border-t-4 border-blue-500">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">{title} Pricing</h3>
      
      <div className="flex flex-col space-y-2 mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Target Profit Margin: <span className="font-semibold">{Math.round((margin || 0) * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.05"
          max="0.90"
          step="0.05"
          value={margin || 0}
          onChange={e => onMarginChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
        />
      </div>

      <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Cost Per Unit:</p>
        <p className="text-lg font-semibold">{formatCurrency(baseCost, currency)}</p>
      </div>

      <div className="flex justify-between items-center mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">Suggested Price:</p>
        <p className={`text-3xl font-extrabold ${colorClass}`}>
          {formatCurrency(cost, currency)}
        </p>
      </div>
      <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-2">
        ({formatCurrency(Math.max(0, (cost || 0) - (baseCost || 0)), currency)} profit per unit)
      </p>
    </div>
  );

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-700 dark:text-gray-300">Initializing App...</span>
      </div>
    );
  }

  // --- Render Functions ---

  const renderRecipeForm = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Calculator className="w-6 h-6 mr-2 text-blue-500" /> Recipe Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-3">
            <InputField
              label="Recipe Name"
              value={currentRecipe.name}
              onChange={val => handleFieldChange('name', val)}
              placeholder="e.g. Classic Chocolate Chip Cookies"
            />
          </div>
          <InputField
            label="Batch Yield (Units)"
            type="number"
            value={currentRecipe.batchYield}
            onChange={val => handleFieldChange('batchYield', val)}
            min={1}
            step={1}
            unit="units"
          />
          <InputField
            label="Labor Time (Hours)"
            type="number"
            value={currentRecipe.laborTimeHours}
            onChange={val => handleFieldChange('laborTimeHours', val)}
            min={0}
            step={0.1}
            unit="hours"
          />
          <InputField
            label={`Labor Cost / Hour`}
            type="number"
            value={currentRecipe.laborCostPerHour}
            onChange={val => handleFieldChange('laborCostPerHour', val)}
            min={0}
            step={1}
            unit={currency}
          />
          <InputField
            label="Overhead Percentage"
            type="number"
            value={(currentRecipe.overheadPercentage * 100) || 0}
            onChange={val => handleFieldChange('overheadPercentage', (val || 0) / 100)}
            min={0}
            step={1}
            unit="%"
          />
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          <Zap className="w-5 h-5 mr-1 inline-block text-yellow-500" /> AI Ingredient Suggestion
        </h3>
        {!apiKey && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <Key className="w-4 h-4 inline mr-1" />
              API key required for AI suggestions. Add your Gemini API key in the settings.
            </p>
          </div>
        )}
        <div className="flex space-x-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Enter recipe name (e.g., 'Artisan Sourdough Loaf')"
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={handleAiSuggestion}
            disabled={loading || !apiKey}
            className="flex items-center px-4 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-1" />}
            Suggest
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          The AI will provide a starter list of ingredients, quantities, and rough costs. Always double-check and edit the costs!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <CostTable
            items={currentRecipe.ingredients}
            type="ingredients"
            onRemove={(id) => removeItem('ingredients', id)}
            onUpdate={(id, key, value) => handleArrayChange('ingredients', id, key, value)}
            currencyCode={currency}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <CostTable
            items={currentRecipe.packaging}
            type="packaging"
            onRemove={(id) => removeItem('packaging', id)}
            onUpdate={(id, key, value) => handleArrayChange('packaging', id, key, value)}
            currencyCode={currency}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );

  const renderCostSummary = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
        <List className="w-6 h-6 mr-2 text-purple-500" /> Cost Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CostSummaryCard label="Ingredient Cost" value={costs.ingredientCost} colorClass="text-indigo-600 dark:text-indigo-400" />
        <CostSummaryCard label="Packaging Cost" value={costs.packagingCost} colorClass="text-indigo-600 dark:text-indigo-400" />
        <CostSummaryCard label="Labor Cost" value={costs.laborCost} colorClass="text-red-600 dark:text-red-400" />
        <CostSummaryCard label="Overhead Cost" value={costs.overheadCost} colorClass="text-red-600 dark:text-red-400" />
        <div className="md:col-span-2">
          <CostSummaryCard label="TOTAL BATCH COST" value={costs.totalBatchCost} colorClass="text-purple-600 dark:text-purple-400" />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-500" /> Suggested Pricing
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <PricingCard
            title="Retail"
            cost={costs.retailPrice}
            margin={currentRecipe.desiredRetailMargin}
            baseCost={costs.costPerUnit}
            onMarginChange={val => handleFieldChange('desiredRetailMargin', val)}
            colorClass="text-green-600 dark:text-green-400"
          />
          <PricingCard
            title="Wholesale"
            cost={costs.wholesalePrice}
            margin={currentRecipe.desiredWholesaleMargin}
            baseCost={costs.costPerUnit}
            onMarginChange={val => handleFieldChange('desiredWholesaleMargin', val)}
            colorClass="text-orange-600 dark:text-orange-400"
          />
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700 text-center mt-6">
          <p className="text-lg font-extrabold text-blue-800 dark:text-blue-300">
            Cost Per Unit (COGS)
          </p>
          <p className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(costs.costPerUnit, currency)}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            This is your minimum break-even price.
          </p>
        </div>
    </div>
  );

  const renderRecipeList = () => (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <List className="w-6 h-6 mr-2 text-blue-500" /> Saved Recipes ({recipes.length})
      </h2>
      <button 
        onClick={newRecipe}
        className="mb-4 flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-150"
      >
        <Plus className="w-5 h-5 mr-2" /> New Recipe
      </button>

      {recipes.length === 0 ? (
        <div className="p-6 text-center bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-300">No saved recipes yet. Start a new one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-150">
              <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{recipe.name}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => loadRecipe(recipe)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition duration-150"
                  title="Load Recipe"
                >
                  <Calculator className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id, recipe.name); }}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50 rounded-lg transition duration-150"
                  title="Delete Recipe"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-200">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center">
            <Calculator className="w-7 h-7 mr-2" /> Price Pilot SaaS
          </h1>
          <div className="flex space-x-3 items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
              User ID: {displayId ? displayId.substring(0, 8) + '...' : 'N/A'}
            </span>
            <button
              onClick={() => setShowRecipeList(!showRecipeList)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 shadow-md"
              title={showRecipeList ? "Hide Recipes" : "Show Saved Recipes"}
            >
              <List className="w-6 h-6" />
            </button>
            <button
              onClick={newRecipe}
              className="p-2 rounded-full text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900 transition duration-150 shadow-md"
              title="New Recipe"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button
              onClick={saveRecipe}
              disabled={loading || !userId}
              className="flex items-center p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition duration-150 disabled:bg-gray-400 shadow-md"
              title="Save Recipe"
            >
              {loading ? <Loader className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 shadow-md"
              title="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="p-4 mb-6 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-700 dark:text-blue-300 flex justify-between items-center">
            <span className="font-medium">{message}</span>
            <button onClick={() => setMessage('')} className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {!userId && isAuthReady && firebaseInitialized && (
            <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-700 dark:text-red-300 flex justify-between items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-medium">Warning: Could not establish an authenticated session. You can calculate costs, but saving and loading recipes will not work.</span>
                <button onClick={() => setMessage('')} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        {!firebaseInitialized && (
            <div className="p-4 mb-6 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-700 dark:text-yellow-300 flex justify-between items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-medium">Firebase not configured. Running in local mode - calculations will work but data won't be saved.</span>
                <button onClick={() => setMessage('')} className="p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        {showRecipeList ? (
          renderRecipeList()
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 p-3 bg-blue-50 dark:bg-gray-800 rounded-xl shadow-inner border border-blue-200 dark:border-gray-700">
                {currentRecipe.name || 'New Recipe'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {renderRecipeForm()}
              </div>
              <div className="lg:col-span-1">
                {renderCostSummary()}
              </div>
            </div>
          </>
        )}
      </main>

      <SettingsModal
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        currentCurrency={currency}
        onSelectCurrency={selectCurrency}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        onSave={saveSettings}
      />
    </div>
  );
};

export default App;
