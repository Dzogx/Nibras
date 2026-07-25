# ADR-004: RAG هجين ومقيد بالنطاق
- **الحالة:** مقبول.
- **القرار:** PostgreSQL full text + trigram + pgvector مع metadata pre-filter وpage citations. لا استرجاع بلا tenant/document/version scope.
