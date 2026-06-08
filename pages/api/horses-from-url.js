// /api/horses-from-url.js
// KAIROS SPORT — Analyse automatique depuis lien EuroTiercé
// Screenshot via thum.io (gratuit) → Gemini Vision → chevaux structurés

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url || !url.includes('eurotierce.be')) {
    return res.status(400).json({ error: 'Lien EuroTiercé invalide' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY manquant' });

  try {
    // Extraire R et C depuis l'URL
    const matchRC = url.match(/R(\d+)\/C(\d+)/i);
    const reunion = matchRC ? parseInt(matchRC[1]) : null;
    const course = matchRC ? parseInt(matchRC[2]) : null;
    const courseRef = matchRC ? `R${reunion}/C${course}` : 'Course';
    const deepLink = matchRC ? `https://www.eurotierce.be/fr/course/R${reunion}/C${course}` : url;

    // Screenshot via thum.io (gratuit, sans clé)
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/2400/${encodeURIComponent(url)}`;

    // Fetch le screenshot
    const imgRes = await fetch(screenshotUrl);
    if (!imgRes.ok) throw new Error('Screenshot impossible');
    const imgBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString('base64');
    const mimeType = 'image/jpeg';

    // Prompt Gemini Vision
    const prompt = `Tu es un expert en courses de chevaux belges (EuroTiercé).
Voici une capture d'écran de la page EuroTiercé pour la course ${courseRef}.

ANALYSE L'IMAGE et extrait TOUS les chevaux visibles.

Retourne UNIQUEMENT ce JSON valide, sans markdown, sans texte avant ou après :
{
  "course": "${courseRef}",
  "lien": "${deepLink}",
  "chevaux": [
    {
      "num": 1,
      "nom": "NOM_CHEVAL",
      "jockey": "INITIALES.NOM",
      "trainer": "INITIALES.NOM",
      "odds": 4.5,
      "vh": 43.5,
      "musique": "2p5p1p2p"
    }
  ],
  "nb_partants": 8,
  "type_course": "Plat",
  "distance": "1600m",
  "terrain": "Bon",
  "confiance_lecture": 85
}

Règles importantes :
- num : numéro du cheval (entier)
- nom : nom en MAJUSCULES
- jockey : format "M.BARZALONA" ou "C.DEMURO" (initiale prénom + point + nom)
- trainer : même format "A.FABRE" ou "JC.ROUGET"
- odds : cote décimale (ex: 4.5, 12.0)
- vh : valeur hippique belge (ex: 43.5) — mettre 0 si absent
- musique : série de chiffres et "p" (ex: "2p5p1p2p") — vide si absent
- confiance_lecture : 0-100 (qualité de lecture de l'image)
- Si un champ est illisible, mets une valeur par défaut raisonnable`;

    // Appel Gemini Vision
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        })
      }
    );

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed.chevaux || parsed.chevaux.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'Aucun cheval détecté dans l\'image. Essaie de recharger la page EuroTiercé.',
        screenshotUrl,
        courseRef
      });
    }

    return res.status(200).json({
      success: true,
      course: parsed.course || courseRef,
      lien: parsed.lien || deepLink,
      chevaux: parsed.chevaux,
      nb_partants: parsed.nb_partants || parsed.chevaux.length,
      type_course: parsed.type_course || 'Plat',
      distance: parsed.distance || '',
      terrain: parsed.terrain || 'Bon',
      confiance_lecture: parsed.confiance_lecture || 70,
      screenshotUrl,
      reunion,
      course_num: course
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Erreur : ${err.message}`
    });
  }
}
