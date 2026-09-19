#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Roundr V0 — app Expo/React Native 100% hors-ligne (aucun backend, compte, cloud, API).
  Persistance locale via AsyncStorage. Thème sombre premium, accents vert néon.
  Dernier lot à valider (non-régression, changements essentiellement VISUELS) :
    - Chrono géant (affichage plein écran depuis l'écran live).
    - Sélection des couleurs de maillot des équipes avant le coup d'envoi.
    - Extension du système de style aux écrans Classement, Résumé, Mes chronos, et configs Cup/Survie.
    - Vérifier que la logique métier (rotations, chrono, sessions, navigation) n'a PAS régressé.
  Lot actuel : AFFINAGE TYPOGRAPHIQUE UNIQUEMENT sur Accueil, Live,
  configuration Match classique et configuration Maracana. Références jointes
  récupérées et examinées. Garder les autres écrans inchangés jusqu'à approbation.

frontend:
  - task: "Passe typographique limitée aux quatre écrans approuvés"
    implemented: true
    working: true
    file: "app/index.tsx, app/live.tsx, app/config/[mode].tsx, src/typography-preview.ts, src/components/{chrono-ring,mode-card,fields,primary-button,resume-card,preset-pill}.tsx, src/features/config-forms.tsx, app/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "QA iteration_4 : domaine, chrono, TypeScript et flux fonctionnels passent. Petites troncatures corrigées (mode sur2 lignes, reprise sans ellipse, noms d'équipe complets à taille adaptée). Self-tests finaux à320 et390 : textes complets mesurés, noms jusqu'à18 caractères et score10 sans débordement, CTA Fin du match complet, reprise conserve2–1 et relance le chrono. Captures finales quatre écrans produites. Preview diagnostiquée saine après un incident réseau transitoire ; aucune modification infra. Attente de validation visuelle utilisateur avant extension."
        -working: "NA"
        -agent: "main"
        -comment: "Les Manrope existantes sont variables et leur défaut est ExtraLight/200, même le fichier nommé Bold. Instances statiques 500/700 avec alias séparés ajoutées pour ces quatre écrans seulement, sans modifier les fontes originales ni les tokens globaux. Chrono 73.7 -> 104 pt à 390pt, scores responsive, titres/CTA renforcés, métadonnées réduites. Aucun moteur, store, règle, navigation, marge ou padding modifié. Opt-in Context pour les composants partagés, faux en Cup/Survie/Custom. Smoke captures quatre écrans OK, lint + tsc OK. À 320pt un CTA tronqué a été corrigé avec une taille compacte 16pt. Vérifier les autres textes longs/petits écrans."
  - task: "Chrono géant plein écran depuis live"
    implemented: true
    working: "NA"
    file: "src/components/giant-chrono.tsx, app/live.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Nouveau composant Modal plein écran. Ouverture/fermeture confirmée en smoke test précédent (giant: 07:55, closed ok). À valider en non-régression."
  - task: "Sélection couleurs de maillot des équipes"
    implemented: true
    working: "NA"
    file: "src/components/fields.tsx, app/config/[mode].tsx, app/live.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Palette de swatches ajoutée. Smoke test 'palette ok'. À valider que la sélection persiste et s'affiche en live sans casser la config."
  - task: "Extension style : Classement, Résumé, Mes chronos, configs Cup/Survie"
    implemented: true
    working: "NA"
    file: "app/standings.tsx, app/summary.tsx, app/presets.tsx, app/config/[mode].tsx, src/features/config-forms.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Restyle visuel aligné au design system. Smoke tests standings/cup/survie ok. À valider non-régression fonctionnelle."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 4
  run_ui: true

test_plan:
  current_focus:
    - "Passe typographique limitée aux quatre écrans approuvés"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Tester uniquement le lot typographique actuel et sa non-régression. Captures Home, Live classique/Maracana, configs classique/Maracana à 390 et 320 (aussi 360/430 si possible). Inspecter troncature/chevauchements, tailles et graisses effectives, chrono pause/reprise, score +1/correction/double chiffres, couleurs/noms, paramètres de config. Vérifier Cup/Survie/Custom et Résumé/Classement/Mes chronos toujours avec alias Manrope originaux. Fonctionnalités 100% locales, pas d'auth ni de backend à tester. Alert.alert natifs non testables sur preview web. Ne pas modifier le code ni les règles."
    -agent: "main"
    -message: "Lot visuel + 2 nouveautés (chrono géant, couleurs équipes). Tests unitaires domaine + chrono OK, home rend conforme. Lancer non-régression front sur les flux : config classique/maracana/cup/survie -> live -> chrono géant open/close -> couleurs équipes -> classement/résumé/mes chronos. NB: preview web ne peut pas déclencher les Alert.alert destructifs (fin de match), ni valider audio natif / partage PNG natif — ne pas les marquer en échec."