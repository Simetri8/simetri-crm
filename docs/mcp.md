# Remote MCP Client Konfigürasyonu (Cursor / Claude)

Bu doküman, `https://<domain>/api/mcp` endpointine API key ile bağlanmak için hazır istemci konfigürasyonlarını içerir.

## Ön Koşullar

- MCP endpointi erişilebilir olmalı: `https://<domain>/api/mcp`
- Sunucuda `MCP_API_KEY` tanımlı olmalı
- TLS (HTTPS) aktif olmalı

## 1) Cursor için Örnek Config

`mcpServers` içine aşağıdaki sunucuyu ekleyin:

```json
{
  "mcpServers": {
    "simetri-crm": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://<domain>/api/mcp",
        "--header",
        "Authorization: Bearer <MCP_API_KEY>"
      ]
    }
  }
}
```

## 2) Claude Desktop için Örnek Config

Claude Desktop yapılandırmasında `mcpServers` içine aşağıdaki örneği ekleyin:

```json
{
  "mcpServers": {
    "simetri-crm": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://<domain>/api/mcp",
        "--header",
        "Authorization: Bearer <MCP_API_KEY>"
      ]
    }
  }
}
```

## Kullanılabilir Tool'lar (Mevcut)

### Temel

- `health_check`
- `get_dashboard_snapshot`
- `search_entities`

### Networking / Contacts

- `list_contacts`
- `get_contact`
- `create_contact`
- `update_contact`
- `set_contact_next_action`
- `list_networking_queue`
- `log_contact_activity`
- `link_contact_to_company`
- `unlink_contact_company`

### CRM / Companies

- `list_companies`
- `get_company`
- `create_company`
- `update_company`
- `set_company_next_action`
- `archive_company`

### CRM / Deals

- `list_deals`
- `get_deal`
- `create_deal`
- `update_deal`
- `move_deal_stage`
- `set_deal_next_action`
- `get_pipeline_summary`

### Ops / Work Orders

- `list_work_orders`
- `get_work_order`
- `create_work_order`
- `update_work_order_status`
- `list_deliverables`
- `create_deliverable`
- `update_deliverable_status`
- `list_tasks`
- `create_task`
- `update_task_status`

### Operasyonel Destek

- `list_overdue_followups`
- `get_today_agenda`
- `list_recent_activities`
- `bulk_update_next_actions`
- `get_owner_workload`

## Dokümana Eklenen (Henüz Uygulanmayan / Gelişim Listesi)

Bu araçlar ileride eklenebilir; roadmap görünürlüğü için burada tutulur:

- `get_deliverable`
- `get_task`
- `update_work_order` (full alan güncelleme)
- `update_deliverable` (full alan güncelleme)
- `update_task` (full alan güncelleme)
- `delete/archive` varyasyonları (`contact`, `deal`, `task`, `work_order`)
- Proposal / Request / Time Tracking araçları:
  - `list_proposals`, `get_proposal`, `create_proposal`, `update_proposal`
  - `list_requests`, `create_request`, `update_request_status`
  - `list_time_entries`, `create_time_entry`, `approve_time_entries`
- Rol/scope bazlı tool erişimi (`read`, `write`, `ops-admin`)

## Hata Kontrolü

- `401 Unauthorized`: API key eksik veya hatalı
- `400 Bad Request`: session/initialize akışı hatalı
- `429 Too Many Requests`: rate limit aşıldı

## Güvenlik Notları

- API key'i repoya yazmayın; sadece env/secret manager kullanın.
- Prod ortamda ters proxy üzerinde ek rate limit ve request-size limiti uygulayın.
- Mümkünse `MCP_ALLOWED_IPS` ile erişimi sınırlandırın.

