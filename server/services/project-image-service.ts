import { openai } from '../replit_integrations/image/client';

interface ProjectImageParams {
  projectName: string;
  industry: string;
  description?: string;
  country?: string;
}

const industryPrompts: Record<string, string> = {
  'Manufacturing': 'modern industrial factory with automated production lines, clean high-tech manufacturing facility, professional engineering environment',
  'Technology': 'futuristic tech office with modern computers and digital displays, startup workspace, innovation hub',
  'Healthcare': 'modern medical facility with advanced equipment, clean hospital environment, healthcare technology',
  'Real Estate': 'luxury modern building architecture, commercial property development, urban skyline',
  'Food & Beverage': 'professional food production facility, modern restaurant kitchen, quality ingredients',
  'Agriculture': 'modern agricultural farm with green fields, smart farming technology, sustainable agriculture',
  'Retail': 'modern retail store interior, shopping mall, commercial space design',
  'Education': 'modern educational institution, university campus, learning environment',
  'Finance': 'professional financial office, modern banking facility, corporate headquarters',
  'Hospitality': 'luxury hotel lobby, resort destination, hospitality service excellence',
  'Transportation': 'modern logistics hub, transportation infrastructure, fleet management',
  'Energy': 'renewable energy installation, solar panels and wind turbines, sustainable power',
  'Construction': 'modern construction site with cranes, building development, architectural project',
};

function getIndustryPrompt(industry: string): string {
  const normalizedIndustry = industry.toLowerCase();
  
  for (const [key, prompt] of Object.entries(industryPrompts)) {
    if (normalizedIndustry.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedIndustry)) {
      return prompt;
    }
  }
  
  return 'modern professional business environment, corporate office, successful enterprise';
}

export async function generateProjectCoverImage(params: ProjectImageParams): Promise<string | null> {
  try {
    const industryContext = getIndustryPrompt(params.industry);
    
    const prompt = `Professional business photography style: ${industryContext}. 
    High quality, photorealistic, corporate presentation quality, suitable for investment report cover.
    Clean, modern aesthetic with professional lighting. 
    Location context: ${params.country || 'Middle East'}.
    No text or logos in the image.
    Square composition that works well as a cropped background.`;

    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Image generation timeout')), 30000)
    );

    const imagePromise = openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
    });

    const response = await Promise.race([imagePromise, timeoutPromise]);
    if (!response) return null;
    
    const base64 = response.data[0]?.b64_json;
    if (!base64 || !base64.startsWith('iVBOR')) {
      console.error('Invalid image data received');
      return null;
    }
    
    return base64;
  } catch (error) {
    console.error('Error generating project cover image:', error);
    return null;
  }
}

export async function generateProjectSectionImage(
  section: 'market' | 'operations' | 'financial' | 'risk',
  industry: string
): Promise<string | null> {
  try {
    const sectionPrompts: Record<string, string> = {
      market: `Market analysis visualization, business growth chart concept, target market illustration, professional infographic style, ${getIndustryPrompt(industry)}`,
      operations: `Operations and workflow visualization, business process illustration, factory floor or office operations, professional photography, ${getIndustryPrompt(industry)}`,
      financial: `Financial analysis concept, investment growth visualization, business success metrics, professional corporate photography, modern office with financial displays`,
      risk: `Risk management concept, business security and planning, strategic decision making, professional corporate environment, boardroom meeting`,
    };

    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Section image timeout')), 20000)
    );

    const imagePromise = openai.images.generate({
      model: 'gpt-image-1',
      prompt: `${sectionPrompts[section]}. High quality, photorealistic, corporate presentation quality. Clean modern aesthetic. No text or logos.`,
      size: '512x512',
    });

    const response = await Promise.race([imagePromise, timeoutPromise]);
    if (!response) return null;
    
    const base64 = response.data[0]?.b64_json;
    if (!base64 || !base64.startsWith('iVBOR')) {
      return null;
    }
    
    return base64;
  } catch (error) {
    console.error(`Error generating ${section} section image:`, error);
    return null;
  }
}

export interface ReportImages {
  cover: string | null;
  market: string | null;
  operations: string | null;
  financial: string | null;
}

export async function generateReportImages(params: ProjectImageParams): Promise<ReportImages> {
  const [cover, market, operations, financial] = await Promise.all([
    generateProjectCoverImage(params),
    generateProjectSectionImage('market', params.industry),
    generateProjectSectionImage('operations', params.industry),
    generateProjectSectionImage('financial', params.industry),
  ]);

  return { cover, market, operations, financial };
}
