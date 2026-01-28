# PowerShell script to translate all remaining hardcoded Polish strings in block-form.tsx

$filePath = "F:\StronyInternetowe\mercur\vendor-panel\src\routes\page-builder\components\block-forms\block-form.tsx"
$content = Get-Content $filePath -Raw

# TimelineBlockForm translations
$content = $content -replace '<Label>Tytuł sekcji</Label>\s+<Input\s+value=\{data\.title \|\| ''''\}\s+onChange=\{\(e\) => onChange\(''title'', e\.target\.value\)\}\s+placeholder="Nasza historia"', '<Label>{t(''pagebuilder.blockForm.timeline.sectionTitle'')}</Label>
        <Input
          value={data.title || ''''}
          onChange={(e) => onChange(''title'', e.target.value)}
          placeholder={t(''pagebuilder.blockForm.timeline.sectionTitlePlaceholder'')}'

$content = $content -replace '<Label>Układ osi czasu</Label>', '<Label>{t(''pagebuilder.blockForm.timeline.layout'')}</Label>'
$content = $content -replace '<Select\.Item value="alternating">Alternating - Naprzemienne</Select\.Item>', '<Select.Item value="alternating">{t(''pagebuilder.blockForm.timeline.layoutAlternating'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="vertical">Vertical - Pionowy</Select\.Item>', '<Select.Item value="vertical">{t(''pagebuilder.blockForm.timeline.layoutVertical'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="horizontal">Horizontal - Poziomy</Select\.Item>', '<Select.Item value="horizontal">{t(''pagebuilder.blockForm.timeline.layoutHorizontal'')}</Select.Item>'
$content = $content -replace 'htmlFor="rounded-edges-timeline" className="cursor-pointer">Zaokrąglone rogi</Label>', 'htmlFor="rounded-edges-timeline" className="cursor-pointer">{t(''pagebuilder.blockForm.timeline.roundedEdges'')}</Label>'
$content = $content -replace '<Label>Kamienie milowe</Label>', '<Label>{t(''pagebuilder.blockForm.timeline.milestones'')}</Label>'
$content = $content -replace 'Wydarzenie \{index \+ 1\}', '{t(''pagebuilder.blockForm.timeline.event'', { number: index + 1 })}'
$content = $content -replace '>Usuń</Button>', '>{t(''pagebuilder.blockForm.common.remove'')}</Button>'
$content = $content -replace '<Label>Rok/Data</Label>', '<Label>{t(''pagebuilder.blockForm.timeline.yearDate'')}</Label>'
$content = $content -replace 'placeholder="2020"', 'placeholder={t(''pagebuilder.blockForm.timeline.yearPlaceholder'')}'
$content = $content -replace 'placeholder="Założenie firmy"', 'placeholder={t(''pagebuilder.blockForm.timeline.eventTitlePlaceholder'')}'
$content = $content -replace 'placeholder="Krótki opis wydarzenia\.\.\."', 'placeholder={t(''pagebuilder.blockForm.timeline.eventDescriptionPlaceholder'')}'
$content = $content -replace 'label="Zdjęcie \(opcjonalnie\)"', 'label={t(''pagebuilder.blockForm.timeline.photo'')}'
$content = $content -replace '\+ Dodaj wydarzenie', '{t(''pagebuilder.blockForm.timeline.addEvent'')}'

# TeamBlockForm translations
$content = $content -replace 'placeholder="Poznaj nasz zespół"', 'placeholder={t(''pagebuilder.blockForm.team.sectionTitlePlaceholder'')}'
$content = $content -replace '<Label>Opis sekcji</Label>', '<Label>{t(''pagebuilder.blockForm.team.sectionDescription'')}</Label>'
$content = $content -replace 'placeholder="Krótki opis zespołu\.\.\."', 'placeholder={t(''pagebuilder.blockForm.team.sectionDescriptionPlaceholder'')}'
$content = $content -replace '<Label>Układ zespołu</Label>', '<Label>{t(''pagebuilder.blockForm.team.layout'')}</Label>'
$content = $content -replace '<Select\.Item value="circular">Circular - Okrągłe zdjęcia</Select\.Item>', '<Select.Item value="circular">{t(''pagebuilder.blockForm.team.layoutCircular'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="cards">Cards - Karty</Select\.Item>', '<Select.Item value="cards">{t(''pagebuilder.blockForm.team.layoutCards'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="minimal">Minimal - Minimalistyczny</Select\.Item>', '<Select.Item value="minimal">{t(''pagebuilder.blockForm.team.layoutMinimal'')}</Select.Item>'
$content = $content -replace 'htmlFor="rounded-edges-team" className="cursor-pointer">Zaokrąglone rogi</Label>', 'htmlFor="rounded-edges-team" className="cursor-pointer">{t(''pagebuilder.blockForm.team.roundedEdges'')}</Label>'
$content = $content -replace '<Label>Członkowie zespołu</Label>', '<Label>{t(''pagebuilder.blockForm.team.members'')}</Label>'
$content = $content -replace 'Osoba \{index \+ 1\}', '{t(''pagebuilder.blockForm.team.person'', { number: index + 1 })}'
$content = $content -replace 'label="Zdjęcie"', 'label={t(''pagebuilder.blockForm.team.photo'')}'
$content = $content -replace '<Label>Imię i nazwisko</Label>', '<Label>{t(''pagebuilder.blockForm.team.name'')}</Label>'
$content = $content -replace 'placeholder="Jan Kowalski"', 'placeholder={t(''pagebuilder.blockForm.team.namePlaceholder'')}'
$content = $content -replace '<Label>Rola/Stanowisko</Label>', '<Label>{t(''pagebuilder.blockForm.team.role'')}</Label>'
$content = $content -replace 'placeholder="Założyciel"', 'placeholder={t(''pagebuilder.blockForm.team.rolePlaceholder'')}'
$content = $content -replace '<Label>Bio</Label>', '<Label>{t(''pagebuilder.blockForm.team.bio'')}</Label>'
$content = $content -replace 'placeholder="Krótki opis osoby\.\.\."', 'placeholder={t(''pagebuilder.blockForm.team.bioPlaceholder'')}'
$content = $content -replace '\+ Dodaj osobę', '{t(''pagebuilder.blockForm.team.addPerson'')}'

# CategoriesBlockForm translations
$content = $content -replace 'placeholder="Nasze kategorie"', 'placeholder={t(''pagebuilder.blockForm.categories.sectionTitlePlaceholder'')}'
$content = $content -replace '<Label>Układ kategorii</Label>', '<Label>{t(''pagebuilder.blockForm.categories.layout'')}</Label>'
$content = $content -replace '<Select\.Item value="classic">Classic - Tradycyjny z nakładkami</Select\.Item>', '<Select.Item value="classic">{t(''pagebuilder.blockForm.categories.layoutClassic'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="minimal">Minimal - Czysty, typograficzny</Select\.Item>', '<Select.Item value="minimal">{t(''pagebuilder.blockForm.categories.layoutMinimal'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="bold">Bold - Dramatyczne pełnoekranowe</Select\.Item>', '<Select.Item value="bold">{t(''pagebuilder.blockForm.categories.layoutBold'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="artistic">Artistic - Kreatywne ramki</Select\.Item>', '<Select.Item value="artistic">{t(''pagebuilder.blockForm.categories.layoutArtistic'')}</Select.Item>'
$content = $content -replace 'htmlFor="rounded-edges-categories" className="cursor-pointer">Zaokrąglone rogi obrazów</Label>', 'htmlFor="rounded-edges-categories" className="cursor-pointer">{t(''pagebuilder.blockForm.categories.roundedEdges'')}</Label>'
$content = $content -replace '<Label>Kategorie</Label>', '<Label>{t(''pagebuilder.blockForm.categories.categories'')}</Label>'
$content = $content -replace 'Dodaj karty kategorii z tytułem, obrazem i linkiem', '{t(''pagebuilder.blockForm.categories.addCardsHint'')}'
$content = $content -replace 'Kategoria \{index \+ 1\}', '{t(''pagebuilder.blockForm.categories.category'', { number: index + 1 })}'
$content = $content -replace '<Label>Nazwa kategorii</Label>', '<Label>{t(''pagebuilder.blockForm.categories.categoryName'')}</Label>'
$content = $content -replace 'placeholder="np\. Ceramika"', 'placeholder={t(''pagebuilder.blockForm.categories.categoryNamePlaceholder'')}'
$content = $content -replace 'placeholder="Krótki opis kategorii\.\.\."', 'placeholder={t(''pagebuilder.blockForm.categories.categoryDescriptionPlaceholder'')}'
$content = $content -replace '<Label>Link do kategorii</Label>', '<Label>{t(''pagebuilder.blockForm.categories.categoryLink'')}</Label>'
$content = $content -replace 'placeholder="/categories/ceramika lub https://artovnia\.com/categories/\.\.\."', 'placeholder={t(''pagebuilder.blockForm.categories.categoryLinkPlaceholder'')}'
$content = $content -replace 'label="Obraz kategorii"', 'label={t(''pagebuilder.blockForm.categories.categoryImage'')}'
$content = $content -replace '\+ Dodaj kategorię', '{t(''pagebuilder.blockForm.categories.addCategory'')}'

# BehindScenesBlockForm translations
$content = $content -replace 'placeholder="Za kulisami"', 'placeholder={t(''pagebuilder.blockForm.behindScenes.sectionTitlePlaceholder'')}'
$content = $content -replace 'placeholder="Zobacz jak powstają nasze produkty\.\.\."', 'placeholder={t(''pagebuilder.blockForm.behindScenes.sectionDescriptionPlaceholder'')}'
$content = $content -replace '<Label>Układ</Label>', '<Label>{t(''pagebuilder.blockForm.behindScenes.layout'')}</Label>'
$content = $content -replace '<Select\.Item value="masonry">Masonry \(Pinterest\)</Select\.Item>', '<Select.Item value="masonry">{t(''pagebuilder.blockForm.behindScenes.layoutMasonry'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="grid">Siatka</Select\.Item>', '<Select.Item value="grid">{t(''pagebuilder.blockForm.behindScenes.layoutGrid'')}</Select.Item>'
$content = $content -replace '<Select\.Item value="carousel">Karuzela</Select\.Item>', '<Select.Item value="carousel">{t(''pagebuilder.blockForm.behindScenes.layoutCarousel'')}</Select.Item>'
$content = $content -replace 'label="Dodaj zdjęcia lub filmy"', 'label={t(''pagebuilder.blockForm.behindScenes.addMedia'')}'
$content = $content -replace 'hint="Zdjęcia i filmy z warsztatu, procesu tworzenia"', 'hint={t(''pagebuilder.blockForm.behindScenes.mediaHint'')}'
$content = $content -replace 'placeholder="Podpis\.\.\."', 'placeholder={t(''pagebuilder.blockForm.behindScenes.caption'')}'

# Save the file
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Translation complete!" -ForegroundColor Green
