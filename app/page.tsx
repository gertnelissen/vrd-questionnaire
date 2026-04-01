'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Question, type Answer } from '@/lib/supabase'
import { CheckCircle } from 'lucide-react'

export default function ConsumerPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [voted, setVoted] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchActiveQuestion = useCallback(async () => {
    const { data } = await supabase
      .from('questions')
      .select('*, answers(*)')
      .eq('is_active', true)
      .maybeSingle()

    setQuestion(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchActiveQuestion()

    const channel = supabase
      .channel('active-question')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        setVoted(null)
        fetchActiveQuestion()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchActiveQuestion])

  const handleVote = async (answer: Answer) => {
    if (voted) return
    setVoted(answer.id)
    await supabase.from('votes').insert({ answer_id: answer.id })
    setTimeout(() => setVoted(null), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl">⏳</div>
        <p className="text-white/40 text-lg">Geen actieve vraag op dit moment.</p>
      </div>
    )
  }

  const answers = question.answers ?? []

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-purple-950/30 pointer-events-none" />

      <div className="mb-3 text-xs font-semibold tracking-widest text-white/20 uppercase">VRD Questionnaire</div>

      <h1 className="text-center text-3xl font-bold text-white mb-10 max-w-3xl leading-snug">
        {question.text}
      </h1>

      <div className={`w-full max-w-4xl grid gap-4 ${answers.length <= 2 ? 'grid-cols-2' : answers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {answers.map((answer, i) => {
          const isVoted = voted === answer.id
          const isDisabled = voted !== null

          return (
            <button
              key={answer.id}
              onClick={() => handleVote(answer)}
              disabled={isDisabled}
              className={`
                relative group rounded-2xl px-6 py-8 text-xl font-semibold text-center
                transition-all duration-300 select-none
                ${isVoted
                  ? 'bg-emerald-500 text-white scale-[1.02] shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                  : isDisabled
                    ? 'bg-white/5 text-white/30 cursor-default'
                    : 'bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white cursor-pointer shadow-lg border border-white/10 hover:border-white/30'
                }
              `}
            >
              {isVoted && (
                <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-white/80" />
              )}
              <span className="block text-white/30 text-sm font-normal mb-1">
                {String.fromCharCode(65 + i)}
              </span>
              {answer.text}
            </button>
          )
        })}
      </div>

      <div className={`mt-8 text-sm text-emerald-400 font-medium transition-opacity duration-500 ${voted ? 'opacity-100' : 'opacity-0'}`}>
        Jouw antwoord is geregistreerd!
      </div>
    </div>
  )
}
