app.post('/api/pdf/convert', async (req, res) => {
  // ...conversion logic...
  // pptxBuffer must be a Buffer containing the .pptx file

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.setHeader('Content-Disposition', 'attachment; filename="converted.pptx"');
  res.send(pptxBuffer); // pptxBuffer must be a Buffer!
});


//convert.js file hai ye api->pdf ma 