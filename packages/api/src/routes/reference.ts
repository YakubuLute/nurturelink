import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { ReferenceService } from '../services/reference.service';

const referenceService = new ReferenceService();
export const referenceRouter = Router();

// GET /reference/manifest — current bundle versions
referenceRouter.get('/manifest', authenticate, async (_req, res, next) => {
  try {
    const manifest = await referenceService.getManifest();
    res.json(manifest);
  } catch (err) {
    next(err);
  }
});

// GET /reference/:bundle/:version — download a bundle (gzipped JSON)
referenceRouter.get('/:bundle/:version', authenticate, async (req, res, next) => {
  try {
    const params = z
      .object({ bundle: z.string(), version: z.string() })
      .parse(req.params);
    const bundle = await referenceService.getBundle(params.bundle, params.version);
    res.set('Content-Type', 'application/json');
    res.set('Content-Encoding', 'gzip');
    res.send(bundle);
  } catch (err) {
    next(err);
  }
});
