// =====================================================
// VIRTUS Smart fit IPT - API ROUTES NEXT.JS
// =====================================================

// -------------------------------------------------------
// FILE: app/api/genesis/save-progress/route.ts
// -------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, currentModule, currentQuestionIndex, responses, timeSpent } = body;

    // Upsert submission (create or update)
    const { data, error } = await supabase
      .from('ipt_submissions')
      .upsert({
        session_id: sessionId,
        current_step: currentModule + 1,
        total_steps: 9,
        responses: responses,
        last_updated_at: new Date().toISOString(),
        is_completed: false,
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, submissionId: data.id });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// FILE: app/api/genesis/submit/route.ts
// -------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateIPTScore } from '@/app/lib/genesis/scoring-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, responses, email, timeSpent } = body;

    // 1. Mettre à jour submission comme complétée
    const { data: submission, error: submissionError } = await supabase
      .from('ipt_submissions')
      .update({
        responses,
        email,
        is_completed: true,
        completed_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (submissionError) throw submissionError;

    // 2. Calculer score IPT
    const scoreData = calculateIPTScore(responses);

    // 3. Sauvegarder score
    const { data: score, error: scoreError } = await supabase
      .from('ipt_scores')
      .insert({
        submission_id: submission.id,
        ipt_score: scoreData.iptScore,
        ipt_category: scoreData.iptCategory,
        metabolic_score: scoreData.metabolicScore,
        infrastructure_score: scoreData.infrastructureScore,
        psychology_score: scoreData.psychologyScore,
        physiology_score: scoreData.physiologyScore,
        adherence_score: scoreData.adherenceScore,
        detected_patterns: scoreData.detectedPatterns,
        red_flags: scoreData.redFlags,
        root_causes: scoreData.rootCauses,
        recommendations: scoreData.recommendations,
        detailed_scores: scoreData.detailedScores,
      })
      .select()
      .single();

    if (scoreError) throw scoreError;

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      scoreId: score.id,
      iptScore: score.ipt_score,
      iptCategory: score.ipt_category,
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit questionnaire' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// FILE: app/api/genesis/score/[submissionId]/route.ts
// -------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { submissionId } = params;

    // Récupérer submission + score
    const { data: submission, error: submissionError } = await supabase
      .from('ipt_submissions')
      .select('*, ipt_scores(*)')
      .eq('id', submissionId)
      .single();

    if (submissionError) throw submissionError;

    if (!submission.ipt_scores || submission.ipt_scores.length === 0) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      submission,
      score: submission.ipt_scores[0],
    });
  } catch (error) {
    console.error('Get score error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve score' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// FILE: app/api/genesis/stripe/checkout/route.ts
// -------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pricing tiers
const TIERS = {
  RAPPORT: {
    name: 'Rapport IPT Complet',
    price: 4900, // 49€ en centimes
    stripePriceId: process.env.STRIPE_PRICE_RAPPORT!, // À créer dans Stripe
  },
  PROTOCOL: {
    name: 'Protocole Personnalisé',
    price: 14900, // 149€
    stripePriceId: process.env.STRIPE_PRICE_PROTOCOL!,
  },
  COACHING: {
    name: 'Coaching VIRTUS Smart fit 12 Semaines',
    price: 99900, // 999€
    stripePriceId: process.env.STRIPE_PRICE_COACHING!,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, tier, email } = body;

    if (!TIERS[tier as keyof typeof TIERS]) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const selectedTier = TIERS[tier as keyof typeof TIERS];

    // Créer Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedTier.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/genesis/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/genesis/results/${submissionId}`,
      customer_email: email,
      metadata: {
        submissionId,
        tier,
      },
    });

    // Enregistrer transaction pending
    await supabase
      .from('payment_transactions')
      .insert({
        submission_id: submissionId,
        stripe_session_id: session.id,
        amount: selectedTier.price / 100,
        currency: 'EUR',
        tier,
        status: 'pending',
      });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// FILE: app/api/genesis/stripe/webhook/route.ts
// -------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // Vérifier webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Gérer events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Mettre à jour transaction
        await supabase
          .from('payment_transactions')
          .update({
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_customer_id: session.customer as string,
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id);

        // TODO: Déclencher génération PDF + envoi email
        // await generateAndSendReport(session.metadata.submissionId, session.metadata.tier);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// FILE: app/api/genesis/resume/[sessionId]/route.ts
// -------------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const { data, error } = await supabase
      .from('ipt_submissions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_completed', false)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Vérifier timeout (1 heure)
    const lastUpdate = new Date(data.last_updated_at);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const SESSION_TIMEOUT = 3600000; // 1 heure

    if (diffMs > SESSION_TIMEOUT) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      sessionId: data.session_id,
      currentModule: data.current_step - 1,
      responses: data.responses,
    });
  } catch (error) {
    console.error('Resume session error:', error);
    return NextResponse.json(
      { error: 'Failed to resume session' },
      { status: 500 }
    );
  }
}
