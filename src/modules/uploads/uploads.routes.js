import { Router } from 'express';
import { uploadProductImage } from '../../middlewares/upload.js';

export const router = Router()

// POST /api/v1/admin/uploads/product-image
router.post('/uploads/product-image', uploadProductImage.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Envie um arquivo no campo "file" (multipart/form-data).',
      });
    }

    const filename = req.file.filename;
    const url = `/uploads/products/${filename}`;
    return res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
});
