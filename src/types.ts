export interface KeyDifference {
  originalSnippet: string;
  convertedSnippet: string;
  description: string;
}

export interface ConversionResult {
  convertedCode: string;
  explanation: string;
  keyDifferences: KeyDifference[];
  efficiencyNotes?: string;
  warnings?: string[];
}

export interface CodeTemplate {
  name: string;
  language: string;
  code: string;
}

export const SUPPORTED_LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "C#",
  "Rust",
  "Go",
  "Swift",
  "PHP",
  "Ruby",
  "SQL",
  "Kotlin"
];

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    name: "Fibonacci (Recursivo com Memoization)",
    language: "Python",
    code: `def fibonacci_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci_memo(n-1, memo) + fibonacci_memo(n-2, memo)
    return memo[n]

# Exemplo de uso
print(f"Fibonacci de 30: {fibonacci_memo(30)}")`
  },
  {
    name: "Requisição API assíncrona",
    language: "JavaScript",
    code: `async function buscarUsuarios() {
  const url = 'https://jsonplaceholder.typicode.com/users';
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) {
      throw new Error(\`Erro HTTP: \${resposta.status}\`);
    }
    const usuarios = await resposta.json();
    return usuarios.map(u => ({ id: u.id, nome: u.name }));
  } catch (erro) {
    console.error('Falhou ao obter usuários:', erro);
    return [];
  }
}`
  },
  {
    name: "Busca Binária (Binary Search)",
    language: "C++",
    code: `#include <iostream>
#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid; // Retorna o índice encontrado
        }
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1; // Não encontrado
}`
  },
  {
    name: "Herança e Encapsulamento",
    language: "Java",
    code: `public class Pessoa {
    private String nome;
    private int idade;

    public Pessoa(String nome, int idade) {
        this.nome = nome;
        this.idade = idade;
    }

    public String obterDetalhes() {
        return nome + " tem " + idade + " anos.";
    }
}

class Funcionario extends Pessoa {
    private double salario;

    public Funcionario(String nome, int idade, double salario) {
        super(nome, idade);
        this.salario = salario;
    }

    @Override
    public String obterDetalhes() {
        return super.obterDetalhes() + " Salário: R$ " + salario;
    }
}`
  },
  {
    name: "Leitura de Arquivo Seguro",
    language: "Rust",
    code: `use std::fs::File;
use std::io::{self, Read};

fn ler_conteudo_arquivo(caminho: &str) -> Result<String, io::Error> {
    let mut arquivo = File::open(caminho)?;
    let mut conteudo = String::new();
    arquivo.read_to_string(&mut conteudo)?;
    Ok(conteudo)
}`
  }
];

export interface ConversionHistoryItem {
  id: string;
  fromLanguage: string;
  toLanguage: string;
  originalCode: string;
  convertedCode: string;
  timestamp: string;
}
