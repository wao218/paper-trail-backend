import { Router } from 'express';
import multer from 'multer';
import { handleUpload } from '../services/llamaindexService';

const router = Router();

const upload = multer({
  dest: './uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      callback(new Error('please upload a pdf file'));
    }

    callback(null, true);
  },
});

router.post('/', upload.single('pdf'), async (req, res) => {
  console.log(req);
  try {
    const file = req.file;
    if (!file) {
      res.status(400).send({ error: 'No file uploaded!' });
      return;
    }
    await handleUpload(file.path);
    res.send({ message: 'upload succesful!' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ errorMessage: 'Failed to process PDF', error });
  }
});

export default router;
