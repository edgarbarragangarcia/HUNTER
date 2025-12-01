export interface FinancialIndicators {
    liquidity_index: number;
    indebtedness_index: number;
    working_capital: number;
    equity: number;
}

export interface ExperienceSummary {
    total_contracts: number;
    total_value_smmlv: number;
    top_codes?: string[];
}

export interface Company {
    id: string;
    profile_id: string;
    company_name: string;
    nit: string;
    legal_representative: string;
    city: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    economic_sector?: string;
    unspsc_codes: string[];
    financial_indicators?: FinancialIndicators;
    experience_summary?: ExperienceSummary;
    created_at: string;
    updated_at: string;
}

export interface Contract {
    id: string;
    company_id: string;
    contract_number: string;
    client_name: string;
    contract_value: number;
    execution_date: string;
    description?: string;
    unspsc_codes?: string[];
    created_at: string;
}

export interface CompanyDocument {
    id: string;
    company_id: string;
    document_name: string;
    document_type: 'legal' | 'financial' | 'technical' | 'other';
    file_url: string;
    mime_type: string;
    file_size: number;
    metadata?: any;
    created_at: string;
}
