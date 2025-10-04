async function TestePage() {
  // Exemplo buscando dados de uma API
  const response = await fetch('https://api.exemplo.com/dados');
  const data = await response.json();

  return (
    <>
      <div>Teste de Conexão</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}

export default TestePage;