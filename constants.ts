export const MODEL_NAME = 'gemini-2.5-flash-image';

export const SAMPLE_PROMPTS = [
  "Modern Minimalist: Clean lines, flat colors, vector style",
  "3D Glossy: High-end render, realistic lighting, isometric view",
  "Neon Cyberpunk: Glowing edges, dark background, futuristic"
];

export const MOCKUP_PRESETS = [
  { 
    id: 'tshirt', 
    label: 'T-Shirt', 
    icon: 'Shirt', 
    prompt: "A high-quality professional product photography shot of a plain white t-shirt featuring the provided logo design centered on the chest. Realistic fabric texture, studio lighting, 4k resolution." 
  },
  { 
    id: 'hoodie', 
    label: 'Hoodie', 
    icon: 'Shirt', 
    prompt: "A professional photo of a heather grey streetwear hoodie on a hanger, featuring the provided logo printed large on the back. Soft lighting, urban aesthetic." 
  },
  { 
    id: 'cap', 
    label: 'Cap', 
    icon: 'HardHat', 
    prompt: "A realistic side-angle photo of a black baseball cap with the provided logo embroidered on the front panel. Fashion photography style, sharp focus, fabric detail." 
  },
  { 
    id: 'mug', 
    label: 'Mug', 
    icon: 'Coffee', 
    prompt: "A white ceramic coffee mug sitting on a oak table with the provided logo printed on the side. Warm morning sunlight, steam rising, cozy atmosphere, depth of field." 
  },
  { 
    id: 'card', 
    label: 'Business Card', 
    icon: 'Tag', 
    prompt: "A stack of premium textured business cards on a dark desk, the top card displaying the provided logo in gold foil stamping. Luxury stationery mockup, macro shot." 
  },
  { 
    id: 'sign', 
    label: 'Office Sign', 
    icon: 'Monitor', 
    prompt: "A 3D acrylic office signage mounted on a modern concrete wall, featuring the provided logo. Corporate interior design, soft overhead lighting." 
  },
  { 
    id: 'van', 
    label: 'Delivery Van', 
    icon: 'HardHat', 
    prompt: "A clean white delivery van parked on a city street, with the provided logo displayed as a large vehicle wrap on the side panel. Commercial vehicle mockup, daylight." 
  },
  { 
    id: 'custom', 
    label: 'Custom Object', 
    icon: 'Sparkles', 
    prompt: "" 
  },
];