// /api/horses-ticket.js
// Génère le ticket optimal du jour + deep link EuroTiercé direct

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const { budget = 20, mode = 'auto' } = req.body || req.query || {};

  try {
    // 1. Récupérer les courses live
    const liveRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://kairos-sport.vercel.app'}/api/horses-live`, {
      cache: 'no-store'
    });
    const liveData = await liveRes.json();

    if (!liveData.success || !liveData.races?.length) {
      return res.status(200).json({
        success: false,
        silence: true,
        message: 'Aucune course disponible pour le moment.',
      });
    }

    const races = liveData.races;

    // 2. Trouver la meilleure opportunité toutes courses confondues
    let bestRace = null;
    let bestHorse = null;
    let bestIndex = 0;

    for (const race of races) {
      for (const horse of race.horses) {
        if (horse.kairosIndex > bestIndex) {
          bestIndex = horse.kairosIndex;
          bestHorse = horse;
          bestRace = race;
        }
      }
    }

    if (!bestHorse) {
      return res.status(200).json({
        success: true,
        silence: true,
        message: 'Aucun cheval trouvé pour le moment.',
      });
    }

    // 3. Déterminer le type de ticket selon l'indice
    const budgetNum = parseFloat(budget) || 20;
    let ticketType, ticketHorses, mise, gainPotentiel, description;

    const top2 = bestRace.horses.slice(0, 2);
    const top3 = bestRace.horses.slice(0, 3);

    if (bestIndex >= 900) {
      ticketType = 'Simple Gagnant';
      ticketHorses = [bestHorse];
      mise = Math.min(budgetNum * 0.08, budgetNum);
      gainPotentiel = mise * bestHorse.odds * 0.9;
      description = `KAIROS confiance exceptionnelle (${bestIndex}/1000). Simple gagnant recommandé.`;
    } else if (bestIndex >= 850) {
      if (top2.length >= 2 && top2[1].kairosIndex >= 700) {
        ticketType = 'Couplé Ordre';
        ticketHorses = top2;
        mise = Math.min(budgetNum * 0.06, budgetNum);
        gainPotentiel = mise * top2[0].odds * top2[1].odds * 0.9 * 0.4;
        description = `Deux chevaux forts. Couplé dans l'ordre recommandé.`;
      } else {
        ticketType = 'Simple Gagnant';
        ticketHorses = [bestHorse];
        mise = Math.min(budgetNum * 0.06, budgetNum);
        gainPotentiel = mise * bestHorse.odds * 0.9;
        description = `Très forte opportunité (${bestIndex}/1000). Simple gagnant.`;
      }
    } else if (bestIndex >= 800) {
      if (top3.length >= 3) {
        ticketType = 'Trio';
        ticketHorses = top3;
        mise = Math.min(budgetNum * 0.04, budgetNum);
        const avgOdds = top3.reduce((a, h) => a + h.odds, 0) / 3;
        gainPotentiel = mise * avgOdds * 2.5 * 0.9;
        description = `Bonne opportunité. Trio recommandé.`;
      } else {
        ticketType = 'Simple Gagnant';
        ticketHorses = [bestHorse];
        mise = Math.min(budgetNum * 0.04, budgetNum);
        gainPotentiel = mise * bestHorse.odds * 0.9;
        description = `Jouable (${bestIndex}/1000). Simple gagnant prudent.`;
      }
    } else if (bestIndex >= 700) {
      ticketType = 'Simple Placé';
      ticketHorses = [bestHorse];
      mise = Math.min(budgetNum * 0.03, budgetNum);
      gainPotentiel = mise * Math.min(bestHorse.odds * 0.35, 2.5) * 0.9;
      description = `⚠️ Risqué (${bestIndex}/1000). Simple placé uniquement — mise réduite.`;
    } else if (bestIndex >= 600) {
      ticketType = 'Simple Placé';
      ticketHorses = [bestHorse];
      mise = Math.min(budgetNum * 0.02, budgetNum);
      gainPotentiel = mise * Math.min(bestHorse.odds * 0.3, 2.0) * 0.9;
      description = `🟠 Très risqué (${bestIndex}/1000). Mise minimale conseillée.`;
    } else {
      ticketType = 'Observation';
      ticketHorses = [bestHorse];
      mise = Math.min(budgetNum * 0.01, 2);
      gainPotentiel = mise * bestHorse.odds * 0.9;
      description = `🔴 Indice faible (${bestIndex}/1000). KAIROS déconseille ce pari — observation seulement.`;
    }


    // 4. Détecter les pièges (favoris à éviter)
    const traps = bestRace.horses
      .filter(h => h.odds < 1.5 && h.kairosIndex < 750)
      .map(h => `${h.name} @${h.odds} — sur-favori sans value`);

    // 5. Construire le deep link EuroTiercé
    const deepLink = bestRace.deepLink || 'https://www.eurotierce.be';
    const deepLinkLabel = bestRace.raceRef
      ? `Ouvrir Course R${bestRace.raceRef.r}/C${bestRace.raceRef.c}`
      : 'Ouvrir EuroTiercé';

    // 6. Calcul Kelly précis
    const kellyFraction = bestIndex >= 900 ? 0.08 : bestIndex >= 850 ? 0.06 : 0.04;
    const miseKelly = parseFloat((budgetNum * kellyFraction).toFixed(2));
    const miseMin = parseFloat((miseKelly * 0.5).toFixed(2));

    // 7. Analyse Gemini (optionnel — commenté pour éviter quota)
    // const narrative = await generateNarrative(bestHorse, bestRace, bestIndex);

    const narrative = buildNarrative(bestHorse, bestRace, bestIndex, ticketType);

    return res.status(200).json({
      success: true,
      silence: false,
      ticket: {
        type: ticketType,
        horses: ticketHorses.map(h => ({
          num: h.num,
          name: h.name,
          jockey: h.jockey,
          odds: h.odds,
          kairosIndex: h.kairosIndex,
          vh: h.vh,
          forme: h.forme,
          odds_movement: h.odds_movement,
        })),
        race: {
          id: bestRace.id,
          name: bestRace.name,
          track: bestRace.track,
          time: bestRace.time,
          going: bestRace.going,
          distance: bestRace.distance,
          country: bestRace.country,
        },
        kairosIndex: bestIndex,
        kairosLabel: getLabel(bestIndex),
        description,
        narrative,
        mise: miseKelly,
        miseMin,
        gainPotentiel: parseFloat(gainPotentiel.toFixed(2)),
        gainNet: parseFloat((gainPotentiel - miseKelly).toFixed(2)),
        traps,
        deepLink,
        deepLinkLabel,
        source: liveData.source,
        generatedAt: new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' }),
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

function getLabel(index) {
  if (index >= 950) return 'EXCEPTIONNEL 🟢';
  if (index >= 900) return 'TRÈS FORT 🟢';
  if (index >= 850) return 'BONNE OPPORTUNITÉ 🟢';
  if (index >= 800) return 'JOUABLE 🟡';
  return 'RISQUÉ 🟠';
}

function buildNarrative(horse, race, index, ticketType) {
  const movement = horse.odds_movement < -0.3 ? `Les cotes ont chuté — signal fort détecté 🔥. ` : '';
  const vh = horse.vh > 30 ? `VH ${horse.vh} — cheval très expérimenté. ` : horse.vh === 0 ? `Premier départ — incertitude. ` : '';
  const forme = horse.forme?.startsWith('1') ? `Dernière course gagnée. ` : '';
  return `${horse.name} affiche un indice KAIROS de ${index}/1000. ${forme}${vh}${movement}Type de pari recommandé : ${ticketType}.`;
}
