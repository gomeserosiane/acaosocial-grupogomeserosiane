# Verificações realizadas

Data: 30/10/2026. Registros de teste sintéticos. Nenhuma mensagem enviada ao WhatsApp.

## Resultado

- **19/19 testes Node aprovados**, executados com `node --test tests/*.test.js`.
- **17/17 verificações no navegador aprovadas**, executadas em `tests/browser.html` com a marcação e os módulos reais da aplicação.
- Consulta **real** ao ViaCEP pela interface, com CEP público de teste `01001-000`: preenchimento automático do endereço e feedback de endereço encontrado observados.
- Teclado real: Tab a partir do campo Nome direcionou ao CPF; barra de espaço marcou o checkbox Advocacia.
- Inspeção visual do formulário em desktop, celular de 320px e tablet de 768px.
- Verificação DOM de ausência de overflow horizontal em **320, 375, 425, 768, 1024 e 1440px**, de uma coluna de campos em celular e de duas em telas maiores; logos em duas ou quatro colunas, respectivamente.
- Verificação estrutural do HTML: **36 IDs únicos, 27 referências de labels/ARIA resolvidas e 10 recursos locais existentes**.
- Sintaxe dos arquivos JavaScript verificada. Sem dependências de execução.
- Contraste dos textos pequenos revisado: azul de texto escurecido sobre fundo claro e placeholders com contraste reforçado. Isso não constitui auditoria completa de WCAG.

## Funções e fluxos cobertos

- CPF válido, inválido, repetido, máscara e colagem.
- CEP e telefones fixo/celular com máscaras.
- Nome incompleto; nomes acentuados, compostos, com hífen e apóstrofo.
- RG com variações estaduais; email vazio, válido e inválido.
- Campos obrigatórios, UF, número e S/N; endereço manual sem consulta bem-sucedida.
- Serviços individuais e múltiplos independentes; ausência de serviço e consentimento.
- Endereço completo em uma linha, título exato, email “Não informado”, serviços ordenados, número oficial e URL codificada uma única vez.
- CEP completo/parcial, inexistente, falhas de rede/HTTP/JSON, respostas inesperadas e timeout.
- Cancelamento por novo CEP, resposta antiga ignorada mesmo quando o transporte ignora o cancelamento, cancelamento ao apagar parte do CEP.
- Preservação de edição manual durante a consulta e preservação dos dados após preparar o WhatsApp.
- Bloqueio do envio inválido; foco no primeiro erro; link alternativo; invalidação do link antigo após edição.
- Labels e associações de erros; ausência de índices de tabulação positivos.
- Ausência de armazenamento próprio de dados pessoais, logs de formulário, eval e innerHTML nos módulos de produção.

## Limites das verificações

- As verificações de abertura do WhatsApp interceptam `window.open` **somente no ambiente de testes**. Confirmaram URL, mensagem e alternativa para pop-up bloqueado sem enviar dados ao serviço. O aplicativo real usa abertura nativa pelo clique do usuário.
- Não foi realizada confirmação manual de envio no WhatsApp, nem teste com conta real de participante.
- Não foi feito deploy na Vercel. Cabeçalhos HTTP e CSP estão configurados em `vercel.json`, mas dependem de verificação após a publicação no domínio final.
- Testes de larguras em iframes no Chrome não substituem validação em aparelhos reais, Safari/iOS e diferentes leitores de tela.
- Não foram medidos Lighthouse ou Core Web Vitals nem realizada certificação/auditoria completa de WCAG ou revisão jurídica.
- O HTML recebeu verificações estruturais próprias; não foi submetido ao validador oficial W3C.

## Pendências institucionais

As nove logomarcas oficiais foram adicionadas. Ainda é necessário preencher o responsável pelo tratamento, o canal para solicitações e os critérios/prazo de retenção e eliminação. A configuração fica em `js/config.js` e as orientações estão no README. A organização deve revisar essas informações antes de publicar.
