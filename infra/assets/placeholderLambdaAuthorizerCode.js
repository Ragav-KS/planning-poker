exports.handler = async function () {
  console.log(
    'This is a placeholder Lambda Authorizer function. Please deploy a real version.',
  );

  return {
    principalId: '*',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: '*',
          Effect: 'Deny',
          Resource: '*',
        },
      ],
    },
  };
};
