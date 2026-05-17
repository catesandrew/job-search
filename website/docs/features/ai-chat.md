---
id: ai-chat
title: AI Career Coach Chat
sidebar_position: 5
---

# AI Career Coach Chat

A streaming AI assistant embedded in every page of the dashboard. Unlike generic ChatGPT, this chat knows who you are — your resume, your applications, your experience. Ask it anything and get answers grounded in your actual data.

## Opening the chat

Click the **chat bubble icon** in the bottom-right corner of any page. The panel opens as an overlay — you can keep the page visible behind it.

## Context-awareness

The most important thing about this chat: **it loads different context depending on what page you're on.**

| Page | Context loaded |
|---|---|
| `/applications/{id}` | Job description, application status, linked resume (all positions + bullets), company insights, high-priority interview questions |
| `/resumes/{id}` | Complete resume — profile summary, all positions and bullets, skills, education |
| `/library` | All experience library entries with bullets, all skill library categories |
| `/cover-letters/{id}` | Cover letter content |
| Any other page | Your 10 most recent applications with status |

This means when you're on an application page and ask "what gaps do I have for this role?", the AI is reading your actual resume against the actual job description — not making guesses.

## Switching AI providers

The chat supports three providers, switchable mid-conversation:

| Provider | Model | Best for |
|---|---|---|
| **Claude** (default) | claude-haiku-4-5 | Nuanced writing, resume copy, detailed analysis |
| **GPT** | gpt-4o-mini | Fast responses, general career questions |
| **Gemini** | gemini-2.0-flash | Alternative perspective, research-style questions |

Click the provider badge in the chat header to switch. The conversation history persists across provider switches.

:::info Provider availability
Providers only work if the corresponding API key is configured in your `.env`. See [Configuration](../configuration) for key setup.
:::

## Suggested prompts

The chat surfaces context-appropriate prompts based on your current page:

**On an application page:**
- "What gaps do I have for this role?"
- "Help me prep for this interview"
- "Draft a follow-up email"

**On a resume page:**
- "How can I improve this resume?"
- "Quantify my achievements"
- "Tailor this for a senior role"

**On the library:**
- "What STAR stories do I have?"
- "Help me write a new achievement bullet"
- "What skills am I missing?"

**On a cover letter:**
- "Review my cover letter"
- "Make it more concise"
- "Strengthen the opening paragraph"

Click any suggested prompt to send it immediately.

## Streaming responses

Responses stream token by token in real time — you see the answer forming as the AI writes it. A loading spinner appears while the first tokens arrive.

## Chat controls

| Control | Action |
|---|---|
| **New chat** (↺ icon) | Clears the conversation history and starts fresh |
| **Close** (✕ icon) | Closes the panel; conversation is preserved until you clear it |
| **Abort** | Sending a new message while the AI is responding cancels the current response |

## Useful things to ask

**Resume questions:**
- "Make this bullet more impactful: [paste bullet]"
- "What's missing from this resume for a Staff Engineer role?"
- "Rewrite my summary to lead with leadership instead of technical skills"

**Interview questions:**
- "What's the best way to answer 'tell me about a time you failed'?"
- "How should I frame my career transition from engineer to manager?"
- "What questions should I ask at the end of my interview?"

**Salary and negotiation:**
- "How do I negotiate after a lowball offer?"
- "What's a strong counter-offer email for a $180k offer when I'm targeting $220k?"
- "How do I evaluate this offer: [paste offer details]"

**Job search strategy:**
- "Which of my applications should I prioritize following up on?"
- "I've been in interviews for 6 weeks with no offers — what should I review?"
- "How do I turn a recruiter screen into a referral?"

## Privacy

Chat messages go directly to the AI provider you've selected (Anthropic, OpenAI, or Google). Conversation history is stored only in your browser's React state — it's not saved to the database and disappears when you close the panel or refresh the page.

Your resume data and application details are included in the AI system prompt for each request. They're sent to the provider as context and are subject to that provider's data handling policies.
