const nextConnect = require('next-connect');
const multer = require('multer');
const upload = multer();
const FormData = require('form-data');
const fetch = require('node-fetch'); // node-fetch@2

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  upload.single('file')(req, res, async function (err) {
    if (err) {
      res.status(500).json({ error: 'Upload error: ' + err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const secret = 'J5pccF6XgSKfVhG6XYxvtS4KTk9iBVWS';

    try {
      const form = new FormData();
      form.append('File', req.file.buffer, req.file.originalname);

      // Step 1: Convert PDF to PPTX
      const response = await fetch(
        `https://v2.convertapi.com/convert/pdf/to/pptx?Secret=${secret}`,
        {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
        }
      );

      const result = await response.json();
      console.log('ConvertAPI response:', result);

      if (!result.Files || !result.Files[0].FileData) {
        res.status(500).json({ error: result.Message || JSON.stringify(result) || 'Conversion failed' });
        return;
      }

      // Step 2: Decode base64 PPTX and send as file
      const pptxBuffer = Buffer.from(result.Files[0].FileData, 'base64');

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="converted-presentation.pptx"'
      );
      res.status(200).send(pptxBuffer);
    } catch (error) {
      res.status(500).json({ error: error.message || 'Conversion failed' });
    }
  });
}