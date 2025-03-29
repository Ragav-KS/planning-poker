exports.handler = async function () {
  console.log(
    'This is a placeholder Lambda function. Please deploy a real version.',
  );

  return {
    statusCode: 503,
    body: JSON.stringify({
      message: 'Placeholder Lambda function',
    }),
  };
};
