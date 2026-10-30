# Ação Social — Cadastro de participantes

Aplicação estática institucional do **Grupo Gomes & Rosiane + Comunidade 7 de Setembro e Parceiros**. HTML5, CSS3 e JavaScript Vanilla com módulos nativos, sem frameworks, compilação, dependências de produção, back-end ou banco de dados.

## Executar localmente

Extraia o ZIP e abra a pasta `acao-social` no terminal. Com Node.js 20 ou superior instalado:

```bash
npm start
```

Acesse `http://localhost:3000`. Não é necessário executar `npm install`. Como alternativa, use Live Server do VS Code ou `python3 -m http.server 3000` na raiz do projeto. Não abra o `index.html` diretamente com `file://`: os módulos precisam de HTTP.

O script `scripts/serve.mjs` é apenas uma ferramenta local; não integra a aplicação publicada. Para mudar a porta, defina a variável de ambiente `PORT`.

## Funcionalidades

- Nove espaços para logomarcas, na ordem: principal, quatro participantes, título, quatro parceiros.
- Nome, CPF, RG, CEP, endereço, número, bairro, cidade, UF, telefone e email (opcional).
- Máscaras para CPF, CEP e telefone, com suporte a colagem e edição no meio do campo.
- CPF com verificação dos dois dígitos e rejeição de sequências repetidas.
- Consulta ao ViaCEP com cancelamento de requisições anteriores, timeout e preservação de alterações manuais.
- Endereço editável, inclusive quando a API falha, e opção “Sem número” com valor `S/N`.
- Seis serviços com seleção múltipla independente e obrigatoriedade de ao menos um.
- Consentimento obrigatório, inicialmente desmarcado, e Aviso de Privacidade expansível.
- Validação junto aos campos, foco no primeiro erro e dados preservados após tentativas.
- Mensagem com formato especificado, email vazio como “Não informado” e serviços na ordem original.
- Abertura oficial do WhatsApp e link alternativo sempre disponível após validação. O participante revisa e confirma o envio manualmente.
- Layout em uma coluna no celular e duas colunas em telas maiores. Foco visível, atalhos de teclado nativos, labels, grupos semânticos e movimento reduzido.

O site **não confirma o envio da mensagem**, não agenda atendimento automaticamente e não verifica disponibilidade de serviços. A abertura do WhatsApp mantém os dados na ficha. Alterações posteriores invalidam o link preparado para evitar mensagens desatualizadas.

## Estrutura

```text
acao-social/
  index.html
  css/                 tokens, base, cabeçalho, formulário, campos, serviços,
                       animações e responsividade em arquivos separados
  js/
    config.js          logomarcas, serviços, WhatsApp e privacidade
    main.js            inicialização e conteúdo configurável
    form.js            estado, consentimento, erros e envio
    validation.js      validações puras
    masks.js           máscaras de entrada
    cep.js             ViaCEP, timeout e controle de concorrência
    whatsapp.js        mensagem e URL oficial
  public/images/logos/ imagens oficiais a adicionar
  tests/               testes Node e testes de integração no navegador
  scripts/serve.mjs    servidor local opcional sem dependências
  favicon.svg
  robots.txt
  vercel.json
  .vercelignore
  package.json
  README.md
  VALIDACAO.md
```

## Testar

Testes de funções, integração da consulta CEP e estrutura:

```bash
npm test
```

Testes do formulário real e responsividade: com `npm start` ativo, abra `http://localhost:3000/tests/browser.html`. A página executa as verificações, mostra os resultados e mantém exemplos em 320px e 768px. Nesse ambiente, ViaCEP e abertura do WhatsApp são **simulados**, sem mensagens externas. A página usa a marcação real de `index.html` e importa os módulos reais da aplicação.

Os casos abrangem CPF, máscaras, RG, email opcional, campos obrigatórios, endereço manual, múltiplos serviços, consentimento, mensagem exata, destino, codificação, falhas de API, timeout, concorrência, preservação de edição, bloqueio de envio, foco e ausência de overflow em 320, 375, 425, 768, 1024 e 1440px. Os registros são sintéticos. Consulte `VALIDACAO.md` para as verificações efetivamente executadas e limitações.

## Adicionar as nove logomarcas

1. Coloque as imagens em `public/images/logos/`, preferencialmente SVG seguro, WebP ou PNG otimizado.
2. Edite `logos` em `js/config.js`. Os índices são 0 (principal), 1–4 (primeira fileira) e 5–8 (segunda fileira).
3. Substitua a definição de `logos` por nove objetos, mantendo essa ordem. Exemplo de **um objeto**:

```js
{ src: 'public/images/logos/principal.webp', alt: 'Nome oficial da instituição' }
```

Um `src` vazio mantém o placeholder. Se a imagem não carregar, o placeholder continua disponível. Imagens são mostradas com `object-fit: contain`, sem cortes ou distorção. Prefira arquivos próximos de 400px para a principal e 280px para as demais, sem margens internas excessivas. Verifique a leitura em celular após substituir.

## Alterar conteúdo

- **WhatsApp:** `CONFIG.whatsapp` em `js/config.js`, apenas números, com país e DDD. Destino atual: `5591999635260`.
- **Serviços:** `CONFIG.services` no mesmo arquivo. A interface, validação e mensagem usam a mesma lista e preservam sua ordem.
- **Paleta:** `css/variables.css`.
- **Textos institucionais:** `index.html`, incluindo título, metadados Open Graph e rodapé.
- **Privacidade:** `CONFIG.privacy` em `js/config.js`: `controller`, `contact` e `retention`. Os textos são inseridos de forma segura no aviso expansível.
- **Tipografia:** usa a família Plus Jakarta Sans se disponível, com fallback imediato para Segoe UI/system-ui. Não há downloads de fontes externas. Para uma fonte específica, hospede-a localmente e defina `@font-face` no CSS.

## Pendências antes de publicar

- Confirmar com as instituições as nove logomarcas oficiais e seus textos alternativos já configurados.
- Identificar o responsável pelo tratamento dos dados.
- Informar um canal oficial para solicitações sobre dados pessoais.
- Definir critérios/prazo de retenção e procedimento de eliminação na organização.
- Revisar o Aviso de Privacidade com a organização e confirmar os serviços e o WhatsApp.
- Testar a consulta real do ViaCEP e a abertura da mensagem em dispositivos e no domínio final.

Não foram inventados CNPJ, razão social, endereço institucional, email institucional ou prazo de retenção. Não é necessário preencher dados que a organização não utiliza; os textos do aviso devem retratar sua prática real.

## Privacidade e segurança

Nenhum dado da ficha é salvo em localStorage, sessionStorage, cookies de cadastro, banco de dados ou logs da aplicação. Não há analytics, rastreadores ou scripts de terceiros. O ViaCEP recebe apenas o CEP consultado. A interface não usa `innerHTML` para dados do participante, nem executa valores recebidos como código.

A mensagem preparada contém os dados pessoais codificados na URL oficial do WhatsApp. Essa URL só é criada depois da validação e do consentimento. Não adicione ferramentas que capturem esses links ou o conteúdo dos campos. `Referrer-Policy: no-referrer` é aplicado no HTML e na configuração da Vercel. Depois do envio, a retenção pelo WhatsApp e pela organização está fora do controle da página. Autopreenchimento gerenciado pelo próprio navegador depende das preferências do participante.

A configuração da Vercel adiciona CSP restritiva, proteção contra sniffing e permissões desativadas para câmera, microfone e geolocalização. Se usar logos de domínio externo, hospede-as localmente ou revise conscientemente `img-src` na CSP. Qualquer alteração de origem de scripts, estilos, fontes ou APIs também exige revisão dessa política.

## Publicar na Vercel

O projeto foi entregue **sem deploy**.

1. Conclua as pendências institucionais acima.
2. Envie a pasta do projeto para um repositório Git de sua conta.
3. Na Vercel, use **Add New → Project**, importe o repositório e escolha a raiz que contém `index.html`.
4. Selecione **Other** como Framework Preset. Sem Build Command e sem Install Command. Output Directory: `.`. O `vercel.json` já define publicação estática sem compilação.
5. Revise e faça o deploy quando autorizado pela organização.
6. No endereço HTTPS final, confira todos os fluxos e teste o WhatsApp em celular e desktop.

`tests/` e `scripts/` são excluídos da publicação por `.vercelignore`. `robots.txt` permite indexação; não há URL canônica ou domínio inventado. Somente a ficha em branco é pública: os dados não geram páginas de participantes.

## Compatibilidade e limites

O público precisa usar navegador moderno com JavaScript, módulos ES, fetch, AbortController e FormData. Não há confirmação automática, autenticação ou armazenamento de inscrições. A entrega não inclui auditoria formal de WCAG nem medição Lighthouse; os recursos de acessibilidade e as verificações realizadas estão documentados separadamente.
