export async function GET() {
  return new Response(JSON.stringify({ message: 'Not implemented' }), {
    status: 501,
    headers: { 'content-type': 'application/json' },
  });
}
