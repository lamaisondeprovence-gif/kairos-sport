-- Table d'apprentissage KAIROS HORSES
CREATE TABLE IF NOT EXISTS ks_horses_results (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  race_id TEXT,
  race_name TEXT,
  track TEXT,
  distance TEXT,
  going TEXT,
  horse_name TEXT NOT NULL,
  horse_num INTEGER,
  jockey TEXT,
  trainer TEXT,
  vh DECIMAL(5,2) DEFAULT 0,
  musique TEXT,
  odds DECIMAL(6,2),
  kairos_index INTEGER,
  predicted_rank INTEGER,
  actual_rank INTEGER,
  nb_courses INTEGER DEFAULT 0,
  nb_victoires INTEGER DEFAULT 0,
  regularite INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les résultats d'aujourd'hui 07/06/2026
INSERT INTO ks_horses_results (date, race_id, race_name, track, distance, going, horse_name, horse_num, jockey, trainer, vh, musique, odds, kairos_index, predicted_rank, actual_rank) VALUES
-- R1/C2 Prix Mélisande
('2026-06-07', 'R1C2', 'Prix Mélisande', 'Longchamp', '2000m', 'Bon à Souple', 'DISPATCHES', 5, 'M. Guyon', 'A. Fabre', 47, '1p1p5p', 1.3, 650, 2, 1),
('2026-06-07', 'R1C2', 'Prix Mélisande', 'Longchamp', '2000m', 'Bon à Souple', 'MAINTAIN', 6, 'C. Soumillon', 'Hf. Devin', 45.5, '0p3p3p1p', 8.2, 820, 1, 2),
('2026-06-07', 'R1C2', 'Prix Mélisande', 'Longchamp', '2000m', 'Bon à Souple', 'AZAMITA', 1, 'M. Barzalona', 'Fh. Graffard', 0, '1p2p', 10.3, 700, 3, 3),
-- R1/C3 Prix de l''Île de la Cité (Quinté+)
('2026-06-07', 'R1C3', 'Prix de l''Île de la Cité', 'Longchamp', '1400m', 'Bon à Souple', 'LA MANDALA', 10, 'C. Soumillon', 'R. Chotard', 38, '0p3p3p1p', 10.6, 810, 4, 1),
('2026-06-07', 'R1C3', 'Prix de l''Île de la Cité', 'Longchamp', '1400m', 'Bon à Souple', 'TORTISAMBERT', 1, 'M. Barzalona', 'F. Chappet', 43.5, '2p5p1p2p8p3p4p3p', 4.8, 830, 3, 2),
('2026-06-07', 'R1C3', 'Prix de l''Île de la Cité', 'Longchamp', '1400m', 'Bon à Souple', 'ALEM', 2, 'C. Demuro', 'Ha. Pantall', 43, '4p5p3p5p3p2p1p4p1p', 10.8, 870, 1, 3),
('2026-06-07', 'R1C3', 'Prix de l''Île de la Cité', 'Longchamp', '1400m', 'Bon à Souple', 'TALENTUOSO', 9, 'M. Grandin', 'Pe. Dubois', 40, '3p9p3p2p3p1p1p4p8p', 11, 760, 5, 4),
('2026-06-07', 'R1C3', 'Prix de l''Île de la Cité', 'Longchamp', '1400m', 'Bon à Souple', 'TEN HORNS', 6, 'A. Pouchin', 'P. Cottier', 42, '0p3p2p4p2p3p4p', 10.4, 840, 2, 5),
-- R1/C4 Prix Paul de Moussac
('2026-06-07', 'R1C4', 'Prix Paul de Moussac', 'Longchamp', '1400m', 'Bon à Souple', 'NIGHTTIME', 9, 'M. Guyon', 'Chr. Head', 51, '6p2p2p1p1p1p2p', 2.1, 720, 2, 1),
('2026-06-07', 'R1C4', 'Prix Paul de Moussac', 'Longchamp', '1400m', 'Bon à Souple', 'GO MAN', 3, 'A. Crastus', 'R. Chotard', 46.5, '2p0p3p1p3p3p1p3p6p', 17.4, 580, 5, 2),
('2026-06-07', 'R1C4', 'Prix Paul de Moussac', 'Longchamp', '1400m', 'Bon à Souple', 'SYNARAN', 1, 'M. Barzalona', 'Fh. Graffard', 45.5, '1p1p6p1p2p', 3.9, 780, 4, 3),
('2026-06-07', 'R1C4', 'Prix Paul de Moussac', 'Longchamp', '1400m', 'Bon à Souple', 'AFANDY', 2, 'C. Demuro', 'Jc. Rouget', 50, '1p2p1p1p', 4.9, 900, 1, 4);

-- Vue statistiques apprentissage
CREATE OR REPLACE VIEW ks_horses_learning_stats AS
SELECT 
  COUNT(*) as total_predictions,
  SUM(CASE WHEN predicted_rank <= 3 AND actual_rank <= 3 THEN 1 ELSE 0 END) as correct_predictions,
  ROUND(100.0 * SUM(CASE WHEN predicted_rank <= 3 AND actual_rank <= 3 THEN 1 ELSE 0 END) / COUNT(*), 1) as precision_pct,
  AVG(CASE WHEN actual_rank <= 3 THEN vh ELSE NULL END) as avg_vh_winners,
  track,
  jockey
FROM ks_horses_results
GROUP BY track, jockey
ORDER BY precision_pct DESC;
