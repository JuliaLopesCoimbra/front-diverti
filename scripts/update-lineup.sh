#!/bin/bash
# Uso: bash update-lineup.sh <JWT_TOKEN>
TOKEN=$1
BASE="https://api.ccbrasil.app.br"
EVENT_ID=2

echo "=== Deletando lineup existente (ids 1-93) ==="
for ID in $(seq 1 93); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    "$BASE/admin/lineup-items/$ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "DELETE $ID → $STATUS"
done

echo ""
echo "=== Criando novo lineup - Festa do Peão de Barretos 2026 ==="

create() {
  curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/admin/lineup-items" \
    -H "Authorization: Bearer $TOKEN" \
    -F "event_id=$EVENT_ID" \
    -F "artist_name=$1" \
    -F "performance_time=$2" \
    -F "event_date=$3" \
    -F "stage=Palco Sertanejo" \
    -F "display_order=$4"
}

# 20/08/2026
echo -n "Panda → ";              create "Panda"                                        "20:00" "2026-08-20" 0; echo ""
echo -n "Matheus & Kauan → ";    create "Matheus & Kauan"                         "22:00" "2026-08-20" 1; echo ""

# 21/08/2026
echo -n "Natanzinho Lima → ";    create "Natanzinho Lima"                              "18:00" "2026-08-21" 0; echo ""
echo -n "Wesley Safadão → ";     create "Wesley Safadão"                          "19:30" "2026-08-21" 1; echo ""
echo -n "Ana Castela → ";        create "Ana Castela"                                  "21:00" "2026-08-21" 2; echo ""
echo -n "CountryBeat → ";        create "CountryBeat"                                  "22:30" "2026-08-21" 3; echo ""

# 22/08/2026
echo -n "Gusttavo Lima → ";      create "Gusttavo Lima"                                "19:00" "2026-08-22" 0; echo ""
echo -n "Alok → ";               create "Alok"                                         "21:00" "2026-08-22" 1; echo ""
echo -n "Nattan → ";             create "Nattan"                                       "23:00" "2026-08-22" 2; echo ""

# 23/08/2026
echo -n "Edson & Hudson → ";     create "Edson & Hudson"                          "20:00" "2026-08-23" 0; echo ""
echo -n "Matogrosso & Mathias →"; create "Matogrosso & Mathias"                   "22:00" "2026-08-23" 1; echo ""

# 25/08/2026
echo -n "Em Breve → ";           create "Em Breve"                                     "20:00" "2026-08-25" 0; echo ""

# 26/08/2026
echo -n "Cesar Menotti → ";      create "Cesar Menotti & Fabiano"                 "19:00" "2026-08-26" 0; echo ""
echo -n "Simone Mendes → ";      create "Simone Mendes"                                "21:00" "2026-08-26" 1; echo ""
echo -n "Alexandre Pires → ";    create "Alexandre Pires (Tour Pagonejo Bão)"     "23:00" "2026-08-26" 2; echo ""

# 27/08/2026
echo -n "Bruno & Marrone → ";    create "Bruno & Marrone"                         "19:00" "2026-08-27" 0; echo ""
echo -n "Gustavo Mioto → ";      create "Gustavo Mioto"                                "21:00" "2026-08-27" 1; echo ""
echo -n "Rionegro & Solimões →"; create "Rionegro & Solimões"                "23:00" "2026-08-27" 2; echo ""

# 28/08/2026
echo -n "Chitãozinho & Xororó →"; create "Chitãozinho & Xororó"        "19:00" "2026-08-28" 0; echo ""
echo -n "Zezé Di Camargo → ";    create "Zezé Di Camargo & Luciano"         "21:00" "2026-08-28" 1; echo ""
echo -n "Hugo & Guilherme → ";   create "Hugo & Guilherme"                        "23:00" "2026-08-28" 2; echo ""

# 29/08/2026
echo -n "Gusttavo Lima → ";      create "Gusttavo Lima"                                "19:00" "2026-08-29" 0; echo ""
echo -n "Leonardo → ";           create "Leonardo"                                     "21:00" "2026-08-29" 1; echo ""
echo -n "João Bosco & Vinicius →"; create "João Bosco & Vinicius"            "23:00" "2026-08-29" 2; echo ""

# 30/08/2026
echo -n "Final do Rodeio → ";    create "Final do Rodeio Internacional"                "22:00" "2026-08-30" 0; echo ""

echo ""
echo "=== Concluído! ==="
