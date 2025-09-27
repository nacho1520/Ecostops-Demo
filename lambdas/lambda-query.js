import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const BUSES_TABLE = process.env.DYNAMO_TABLE;

export const handler = async () => {
  const resp = await ddb.send(new ScanCommand({
    TableName: BUSES_TABLE,
    ProjectionExpression: "#l",
    ExpressionAttributeNames: { "#l": "line" }
  }));

  const set = new Set((resp.Items || []).map(it => it.line?.S).filter(Boolean));
  const lineas = Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

  return {
    statusCode: 200,
    headers: { 
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify({ lineas })
  };
};
