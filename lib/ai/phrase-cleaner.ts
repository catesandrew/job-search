/**
 * Post-process AI-rewritten bullet content to remove buzzwords and AI-sounding phrases.
 * Ported from Resume-Matcher refinement.py AI_PHRASE_REPLACEMENTS.
 * Safe to run on HTML content — replacements only match word boundaries, not tag names.
 */

const REPLACEMENTS: Array<[RegExp, string]> = [
  // Overused action verbs
  [/\bspearheaded\b/gi, 'led'],
  [/\borchestrated\b/gi, 'coordinated'],
  [/\bchampioned\b/gi, 'advocated for'],
  [/\bsynergized\b/gi, 'collaborated'],
  [/\bleveraged\b/gi, 'used'],
  [/\brevolutionized\b/gi, 'transformed'],
  [/\bpioneered\b/gi, 'introduced'],
  [/\bcatalyzed\b/gi, 'initiated'],
  [/\boperationalized\b/gi, 'implemented'],
  [/\benvisioned\b/gi, 'planned'],
  [/\beffectuated\b/gi, 'completed'],
  [/\bendeavored\b/gi, 'worked'],
  [/\bfacilitated\b/gi, 'helped'],
  [/\butilized\b/gi, 'used'],
  // Corporate buzzwords
  [/\bsynergies\b/gi, 'collaborations'],
  [/\bsynergy\b/gi, 'collaboration'],
  [/\bparadigm shift\b/gi, 'change'],
  [/\bparadigm\b/gi, 'approach'],
  [/\bbest-in-class\b/gi, 'top-performing'],
  [/\bworld-class\b/gi, 'high-quality'],
  [/\bcutting-edge\b/gi, 'modern'],
  [/\bbleeding-edge\b/gi, 'modern'],
  [/\bgame-changing\b/gi, 'innovative'],
  [/\bgame-changer\b/gi, 'innovation'],
  [/\bdisruptive\b/gi, 'innovative'],
  [/\bholistic\b/gi, 'comprehensive'],
  [/\brobust\b/gi, 'strong'],
  [/\bscalable\b/gi, 'expandable'],
  [/\bactionable\b/gi, 'practical'],
  [/\bimpactful\b/gi, 'effective'],
  [/\bproactively\b/gi, 'actively'],
  [/\bproactive\b/gi, 'active'],
  [/\bstakeholders\b/gi, 'team members'],
  [/\bstakeholder\b/gi, 'team member'],
  [/\bdeliverables\b/gi, 'outputs'],
  [/\bbandwidth\b/gi, 'capacity'],
  [/\bcircle back\b/gi, 'follow up'],
  [/\bdeep dive\b/gi, 'analysis'],
  [/\bmove the needle\b/gi, 'make progress'],
  [/\blow-hanging fruit\b/gi, 'quick wins'],
  [/\btouch base\b/gi, 'connect'],
  [/\bvalue-add\b/gi, 'benefit'],
  // Filler phrases
  [/\bin order to\b/gi, 'to'],
  [/\bfor the purpose of\b/gi, 'to'],
  [/\bwith a view to\b/gi, 'to'],
  [/\bat the end of the day\b/gi, ''],
  [/\bmoving forward\b/gi, ''],
  [/\bgoing forward\b/gi, ''],
  [/\bon a daily basis\b/gi, 'daily'],
  [/\bon a regular basis\b/gi, 'regularly'],
  [/\bin a timely manner\b/gi, 'promptly'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bin the event that\b/gi, 'if'],
  [/\bin light of the fact that\b/gi, 'since'],
  // Em-dash variants
  [/\s*—\s*/g, ', '],
  [/\s*---\s*/g, ', '],
]

export function cleanAiPhrases(text: string): string {
  let result = text
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }
  // Collapse any double spaces or leading/trailing spaces left by empty replacements
  result = result.replace(/\s{2,}/g, ' ').trim()
  return result
}
