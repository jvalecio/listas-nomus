

//POST https://lzenergia.nomus.com.br/lzenergia/SolicitacaoCompraCadastro.do?metodo=Salvar
let error_list = [];
// Função que adiciona o botão "Criar lista de compras"
function addButton() {
    console.log("Tentando adicionar o botão...");

    // Seleciona o elemento <ul> onde o botão será adicionado
    const tdElement = document.querySelector('#container_null table tbody tr td');
    
    if (tdElement) {
        // Crie o novo botão
        const fileButton = document.createElement("input");
        fileButton.type = "file";
        fileButton.id = "lista_compras";
        //newButton.value = "Criar lista de compras";
        fileButton.className = "tipo1"; // Você pode definir a classe conforme necessário
        //fileButton.style.display="none";
        fileButton.accept=".xlsx,.xls";
        
        
        // Adiciona o novo botão dentro do <td>
        tdElement.insertBefore(fileButton, tdElement.firstChild);
        
        const newButton = document.createElement("input");
        newButton.type = "button";
        newButton.id = "botao_criar_lista_compras";
        newButton.value = "Criar lista de compras"
        //newButton.value = "Criar lista de compras";
        newButton.className = "tipo1"; // Você pode definir a classe conforme necessário
        newButton.accept=".xlsx,.xls";
        
        newButton.addEventListener("click", processarArquivo);
        // Adiciona o novo botão dentro do <td>
        tdElement.insertBefore(newButton, tdElement.firstChild);

        console.log("Botão adicionado com sucesso!");
    } else {
        console.log("Elemento <ul> não encontrado.");
    }
}

// Função para mostrar o input de arquivo ao clicar no botão
function mostrarInputArquivo() {
    // Abre a caixa de diálogo de upload de arquivo ao clicar no botão
    document.getElementById('input_arquivo_excel').click();
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

// Função para processar o arquivo Excel
function processarArquivo() {
    console.log("Processando arquivo");
    //const arquivo = event.target.files[0]; // Obtém o arquivo selecionado
    const arquivo = document.getElementById("lista_compras").files[0];
    
    if (arquivo) {
        promise_array = [];
        console.log("Arquivo not null");
        // Verifica se o arquivo é do tipo Excel
        if (arquivo.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || arquivo.type === "application/vnd.ms-excel") {
            const reader = new FileReader();
            error_list = [];

            reader.onload = async function(e) {
                // Usando a biblioteca XLSX para ler o conteúdo do Excel
                const dados = e.target.result;
                const workbook = XLSX.read(dados, {type: "binary"});
                
                // Acessando a primeira planilha
                const primeiraPlanilha = workbook.Sheets[workbook.SheetNames[0]];

                // Convertendo os dados da planilha para JSON
                const dadosJson = XLSX.utils.sheet_to_json(primeiraPlanilha, {header: 1});
                const data = dadosJson;
                //console.log(dadosJson); // Exibe os dados no console (pode processar como precisar)
                
                for (let index = 1; index < data[0].length; index++) {
                    const product_id = data[0][index];
                    const quantity = data[4][index]
                    
                    promise_array.push(createPurchaseRequest(product_id,quantity)); 
                }
                
                await Promise.all(promise_array);
                if(error_list.length>0){
                    console.log(error_list.toString());
                    window.confirm("ERRO AO CRIAR A SOLICITAÇÃO DE COMPRA DOS SEGUINTES ITENS: "+error_list.toString());
                }else{
                    window.confirm("SUCESSO");
                    chrome.runtime.sendMessage({ action: "getActiveTab" }, (response) => {
                        console.log("Active Tab:", response);
                    });
                }
            };
            reader.readAsBinaryString(arquivo);
        } else {
            alert("Por favor, selecione um arquivo Excel válido (.xlsx ou .xls).");
        }
    }
}

function getCurrentDateFormatted() {
    const today = new Date(); // Obtém a data atual
    const day = String(today.getDate()).padStart(2, '0'); // Obtém o dia com 2 dígitos
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Obtém o mês (lembre-se que os meses começam do 0)
    const year = today.getFullYear(); // Obtém o ano

    return `${day}/${month}/${year}`; // Formata a data no formato DD/MM/YYYY
}

async function getProductInfo(product_number) {
    console.log("Getting product info...");
    const id_empresa = 2;
    const url = `https://lzenergia.nomus.com.br/lzenergia/SolicitacaoCompraCadastro.do?metodo=Selecionar_produto&term=${product_number}&idEmpresa=${id_empresa}&query=${product_number}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Product data retrieved:", data[0]);
        return data[0]; // Return the first product info
    } catch (err) {
        console.error('Fetch Error :-S', err);
        error_list.push(product_number);
        return;
    }
}

async function createPurchaseRequest(product_id, quantity) {
    console.log("Creating purchase request...");

    // Wait for product info to be retrieved
    const product_info = await getProductInfo(product_id);

    // Handle the case where the product info is not available
    if (!product_info) {
        console.error("Failed to retrieve product info.");
        error_list.push(product_id);
        return;
    }

    console.log("Product info:", product_info);
    console.log("Quantity:", quantity);

    const id_empresa = 2;
    const url = "https://lzenergia.nomus.com.br/lzenergia/SolicitacaoCompraCadastro.do?metodo=Salvar";

    const formData = new FormData();
    formData.append('edicao', 'false');
    formData.append('id', '');
    formData.append('idSolicitacaoCompra', '');
    formData.append('origem', '2');
    formData.append('status', '3');
    formData.append('nomeUsuario', 'João Alécio');
    formData.append('idEmpresa', id_empresa);
    formData.append('nomeOrdem', '');
    formData.append('idOrdem', '');
    formData.append('nomeProduto', product_info.result);
    formData.append('idProduto', product_info.id);
    formData.append('idUnidadeMedidaPrincipal', product_info.idUnidadeMedidaPrincipal);
    formData.append('abreviaturaUnidadeMedidaPrincipal', product_info.abreviaturaUnidadeMedidaPrincipal);
    formData.append('descricaoProduto', product_info.descricaoProduto);
    formData.append('infAdProd', '');
    formData.append('idUnidadeMedida', product_info.idUnidadeMedidaPrincipal);
    formData.append('qtdeInformada', quantity);
    formData.append('quantidade', quantity);
    formData.append('dataEmissao', getCurrentDateFormatted());
    formData.append('dataNecessidade', '20/12/2024');
    formData.append('dataLimite', '');
    formData.append('observacoes', '');
    formData.append('ultimoEstadoJanela', 'false');
    formData.append('nomesProjetos(0)', '');
    formData.append('idsProjetos(0)', '');
    formData.append('qtdesProjetos(0)', quantity);
    formData.append('metodo', 'Salvar');

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data = response;
        console.log("Purchase request response:", data);

        // Example of using data from the response
        if (data[0] && data[0].unidadeMedidaProduto) {
            console.log("Unit of Measurement:", data[0].unidadeMedidaProduto);
        }
    } catch (err) {
        console.error('Fetch Error :-S', err);
        error_list.push(product_id);
        return;
    }
}

// Example usage:
// createPurchaseRequest("190", 10);


// Criando um MutationObserver para observar mudanças no DOM
const observer = new MutationObserver((mutationsList) => {
    // Verifica se a estrutura <ul role="tablist"> foi adicionada ou alterada
    const tabList = document.querySelector('#container_null table tbody tr td');
    if (tabList) {
        addButton();  // Adiciona o botão se o <ul> for encontrado
        observer.disconnect();  // Para de observar depois que o botão é adicionado
    }
});

// Começa a observar mudanças no DOM
observer.observe(document.body, { childList: true, subtree: true });

console.log("MutationObserver ativado.");
