import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('API route called')
    const { customText, availableEPAs } = await request.json()
    console.log('Request data:', { customText, availableEPAs: availableEPAs?.length })

    if (!customText || !availableEPAs) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not configured')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('Making OpenAI API call...')

    // Create a prompt for the AI to map the case to the most appropriate EPA
    const epaList = availableEPAs.map((epa: any) => 
      `${epa.code}: ${epa.title} - ${epa.description}`
    ).join('\n')

    const prompt = `You are a medical expert helping to match surgical cases to the appropriate Entrustable Professional Activity (EPA) from the American Board of Surgery.

Given the following case description: "${customText}"

Please match it to the most appropriate EPA from this list:
${epaList}

Consider medical terminology, abbreviations, and context. Common medical abbreviations include:
- "chole" = cholecystectomy (gallbladder surgery) → EPA-10
- "appy" = appendectomy → EPA-4
- "peg" = PEG tube (percutaneous endoscopic gastrostomy) → EPA-9
- "egd" = esophagogastroduodenoscopy → EPA-9
- "sbo" = small bowel obstruction → EPA-15
- "lap" = laparoscopic
- Medical shorthand and common surgical abbreviations should be recognized

Focus on the primary surgical procedure or condition being described. Be precise with medical terminology.

Return your response as a JSON object with:
{
  "epaCode": "EPA-X",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this EPA was selected",
  "suggestedComment": "A professional comment about the case mapping"
}

Be precise and use your medical knowledge to make the best match.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical expert specializing in surgical education and EPA mapping. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent results
    })

    console.log('Received OpenAI API response')

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    console.log('Parsed OpenAI API response')

    // Parse the AI response
    const aiResponse = JSON.parse(cleanedResponse)
    
    // Find the matched EPA
    const matchedEPA = availableEPAs.find((epa: any) => epa.code === aiResponse.epaCode)
    
    if (!matchedEPA) {
      throw new Error('AI selected an invalid EPA code')
    }

    console.log('Returning EPA mapping response')

    return NextResponse.json({
      epaId: matchedEPA.id,
      suggestedComment: aiResponse.suggestedComment || `AI-mapped case: ${customText}`,
      confidence: aiResponse.confidence,
      reasoning: aiResponse.reasoning
    })

  } catch (error) {
    console.error('Error in EPA mapping API:', error)
    return NextResponse.json(
      { error: 'Failed to map case to EPA' },
      { status: 500 }
    )
  }
}
