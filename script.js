document.addEventListener("DOMContentLoaded", () => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "auto" });

    initNavigation();
    initTheme();
    initLanguage();
    initAnimations();
    initScrollReveal();
    initParallax();
    initContactForm();
    initStatsCounter();
    initBurgerMenu();
    initMobileNavbarControls();
    initCardNavigation();
    initStatsSpotlight();
    initWorkflowReveal();
    restoreActivePage();
    initProjectGalleryLightbox();

    requestAnimationFrame(() => requestAnimationFrame(syncAllUIState));
});

// ─── SAFE STORAGE ──────────────────────────────────────────────────────────

const safeStorage = {
    get(key, fallback = null) {
        try { return localStorage.getItem(key) ?? fallback; }
        catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, value); }
        catch { /* silent */ }
    },
};

// ─── PAGE NAVIGATION ───────────────────────────────────────────────────────

function restoreActivePage() {
    const savedPage = sessionStorage.getItem("activePage") || "home";

    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const targetPage = document.getElementById(savedPage);
    const targetLink = document.querySelector(`.nav-link[data-page="${savedPage}"]`);

    if (targetPage) targetPage.classList.add("active");
    if (targetLink) targetLink.classList.add("active");

    document.querySelectorAll(".project-detail-view.active").forEach(el => el.classList.remove("active"));

    document.querySelectorAll("#projects .section").forEach(section => {
        section.classList.remove("hidden");
        section.querySelectorAll(".projects-grid, .section-title, .section-desc").forEach(el => {
            el.classList.remove("hidden");
        });
    });
}

function navigateToPage(pageId) {
    const target = document.getElementById(pageId);
    if (!target) return;

    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const targetLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (targetLink) targetLink.classList.add("active");
    target.classList.add("active");

    sessionStorage.setItem("activePage", pageId);

    // Reset project detail state setiap kali navigasi ke halaman projects
    if (pageId === "projects") {
        document.querySelectorAll(".project-detail-view.active").forEach(el => {
            el.classList.remove("active");
        });
        document.querySelectorAll("#projects .section").forEach(s => {
            s.classList.remove("hidden");
            s.querySelectorAll(".projects-grid, .section-title, .section-desc").forEach(el => {
                el.classList.remove("hidden");
            });
        });
    }

    initScrollReveal();
    initWorkflowReveal();
    window.scrollTo({ top: 0, behavior: "auto" });

    const navOverlay = document.getElementById("navOverlay");
    if (navOverlay?.classList.contains("open")) {
        navOverlay.classList.remove("open");
        navOverlay.setAttribute("aria-hidden", "true");
        const burgerBtn = document.getElementById("burgerBtn");
        if (burgerBtn) {
            burgerBtn.classList.remove("open");
            burgerBtn.setAttribute("aria-expanded", "false");
        }
        document.body.style.overflow = "";
    }
}

function initNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId) navigateToPage(pageId);
        });
    });
}

// ─── CARD NAVIGATION ───────────────────────────────────────────────────────

function initCardNavigation() {
    initProjectDetail();

    document.addEventListener("click", e => {
        const projectCard = e.target.closest(".home-project-card[data-navigate-project]");
        if (projectCard) {
            navigateToPage("projects");
            setTimeout(() => openProjectDetail(projectCard.dataset.navigateProject), 80);
            return;
        }

        const navigateCard = e.target.closest(".card-clickable[data-navigate]");
        if (navigateCard) navigateToPage(navigateCard.dataset.navigate);
    });

    document.addEventListener("keydown", e => {
        if (e.key !== "Enter" && e.key !== " ") return;

        const projectCard = e.target.closest(".home-project-card[data-navigate-project]");
        if (projectCard) {
            e.preventDefault();
            navigateToPage("projects");
            setTimeout(() => openProjectDetail(projectCard.dataset.navigateProject), 80);
            return;
        }

        const navigateCard = e.target.closest(".card-clickable[data-navigate]");
        if (navigateCard) {
            e.preventDefault();
            navigateToPage(navigateCard.dataset.navigate);
        }
    });
}

// ─── STATS SPOTLIGHT ───────────────────────────────────────────────────────

function initStatsSpotlight() {
    if ("ontouchstart" in window) return;

    document.querySelectorAll(".stat").forEach(stat => {
        stat.addEventListener("mousemove", e => {
            const rect = stat.getBoundingClientRect();
            stat.style.setProperty("--sx", `${e.clientX - rect.left}px`);
            stat.style.setProperty("--sy", `${e.clientY - rect.top}px`);
            stat.classList.add("spotlight-active");
        });
        stat.addEventListener("mouseleave", () => stat.classList.remove("spotlight-active"));
    });

    const hero = document.querySelector(".hero");
    if (!hero) return;

    let heroIdleRAF = null;
    let heroIdleStartTime = null;
    const heroIdleDuration = 1500;
    let idleFrom = { x: 50, y: 50 };
    let idleTo = { x: 50, y: 50 };

    const randomIdleTarget = () => ({
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 70,
    });

    const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const tickIdle = timestamp => {
        if (!heroIdleStartTime) heroIdleStartTime = timestamp;
        const t = Math.min((timestamp - heroIdleStartTime) / heroIdleDuration, 1);
        const eased = easeInOut(t);

        hero.style.setProperty("--hx", `${idleFrom.x + (idleTo.x - idleFrom.x) * eased}%`);
        hero.style.setProperty("--hy", `${idleFrom.y + (idleTo.y - idleFrom.y) * eased}%`);

        if (t < 1) {
            heroIdleRAF = requestAnimationFrame(tickIdle);
        } else {
            idleFrom = { ...idleTo };
            idleTo = randomIdleTarget();
            heroIdleStartTime = null;
            heroIdleRAF = requestAnimationFrame(tickIdle);
        }
    };

    const startHeroIdle = () => {
        if (heroIdleRAF) return;
        idleTo = randomIdleTarget();
        heroIdleStartTime = null;
        heroIdleRAF = requestAnimationFrame(tickIdle);
    };

    const stopHeroIdle = () => {
        if (!heroIdleRAF) return;
        cancelAnimationFrame(heroIdleRAF);
        heroIdleRAF = null;
        heroIdleStartTime = null;
    };

    startHeroIdle();

    hero.addEventListener("mouseenter", () => {
        stopHeroIdle();
        hero.classList.add("spotlight-active");
    });

    hero.addEventListener("mousemove", e => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--hx", `${e.clientX - rect.left}px`);
        hero.style.setProperty("--hy", `${e.clientY - rect.top}px`);
    });

    hero.addEventListener("mouseleave", () => {
        hero.classList.remove("spotlight-active");
        const rect = hero.getBoundingClientRect();
        const hxRaw = getComputedStyle(hero).getPropertyValue("--hx").trim();
        const hyRaw = getComputedStyle(hero).getPropertyValue("--hy").trim();
        idleFrom = {
            x: (parseFloat(hxRaw) / rect.width * 100) || 50,
            y: (parseFloat(hyRaw) / rect.height * 100) || 50,
        };
        idleTo = randomIdleTarget();
        heroIdleStartTime = null;
        startHeroIdle();
    });
}

// ─── WORKFLOW REVEAL ───────────────────────────────────────────────────────

let _workflowRevealObserver = null;

function initWorkflowReveal() {
    if (_workflowRevealObserver) {
        _workflowRevealObserver.disconnect();
        _workflowRevealObserver = null;
    }

    const steps = document.querySelectorAll(".workflow-step");
    if (!steps.length) return;

    steps.forEach(step => step.classList.remove("revealed"));

    _workflowRevealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                _workflowRevealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    steps.forEach(step => _workflowRevealObserver.observe(step));
}

// ─── THEME ─────────────────────────────────────────────────────────────────

function initTheme() {
    const themeBtn = document.querySelector(".theme-btn");
    if (!themeBtn) return;

    applyTheme(localStorage.getItem("theme") || "dark");

    themeBtn.addEventListener("click", () => {
        applyTheme(document.documentElement.classList.contains("light") ? "dark" : "light");
    });
}

function applyTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");

    const themeBtn = document.querySelector(".theme-btn");
    if (themeBtn) {
        themeBtn.innerHTML = theme === "light"
            ? '<i class="ri-sun-fill"></i>'
            : '<i class="ri-moon-fill"></i>';
    }

    localStorage.setItem("theme", theme);
    syncMobileThemeIcon();
}

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────

const translations = {
    en: {
        nav_home: "Home",
        nav_about: "About",
        nav_services: "Services",
        nav_projects: "Projects",
        nav_contact: "Contact",
        profile_role: "Technical Support Specialist",
        footer_made: "Made with",
        footer_by: "by",
        hero_greeting: "Hi,",
        hero_im: "I'm",
        hero_location: "South Jakarta, Indonesia",
        position_1: "Technical Support Specialist",
        position_2: "Helpdesk Engineer",
        position_3: "IT Operations Support",
        hero_summary: "Technical Support & Helpdesk Specialist with 4+ years of experience handling enterprise systems, incident management, and SLA-driven operations for national-scale clients.",
        hero_cta_contact: "Get In Touch",
        hero_cta_projects: "View Projects",
        stat_years: "Years Experience",
        stat_clients: "Enterprise Clients",
        stat_products: "Products Supported",
        stat_projects: "Dev Projects",
        home_services_title: "What I Do",
        home_services_desc: "Core areas of expertise.",
        home_services_link: "See full services →",
        home_projects_title: "Featured Projects",
        home_projects_desc: "Selected work.",
        home_projects_link: "View all projects →",
        cta_strip_title: "Ready to work together?",
        cta_strip_desc: "I'm open to new opportunities, collaborations, and interesting projects.",
        cta_strip_contact: "Contact Me",
        cta_strip_about: "Learn More About Me",
        svc_support_title: "Technical Support",
        svc_support_short: "Troubleshooting, incident management, and root cause analysis for enterprise applications.",
        svc_support_desc: "Handling technical issues related to applications and systems, performing troubleshooting and root cause analysis to resolve incidents effectively.",
        svc_support_d1: "Incident triage & resolution",
        svc_support_d2: "Root cause analysis reports",
        svc_support_d3: "Remote & on-site troubleshooting",
        svc_support_d4: "System log review & diagnosis",
        svc_helpdesk_title: "Helpdesk Operations",
        svc_helpdesk_short: "SLA-driven ticket management and technical assistance for end users.",
        svc_helpdesk_desc: "Providing technical assistance to end users, managing tickets and service requests in accordance with SLA standards, and ensuring timely resolution.",
        svc_helpdesk_d1: "SLA-compliant ticket handling",
        svc_helpdesk_d2: "End-user technical assistance",
        svc_helpdesk_d3: "Service request management",
        svc_helpdesk_d4: "24/7 operational support",
        svc_webdev_title: "Web Development",
        svc_webdev_short: "Functional web apps with HTML, CSS, PHP, and MySQL from design to deployment.",
        svc_webdev_desc: "Building functional web applications using HTML, CSS, PHP, and MySQL — from requirements analysis and system design through to implementation.",
        svc_webdev_d1: "Requirements analysis & planning",
        svc_webdev_d2: "Responsive front-end development",
        svc_webdev_d3: "PHP & MySQL back-end systems",
        svc_webdev_d4: "CRUD & data management apps",
        svc_coord_title: "Cross-Team Coordination",
        svc_coord_short: "Bridging developers, account managers, and business teams for smooth delivery.",
        svc_coord_desc: "Coordinating with developer, account manager, and business teams to ensure smooth service delivery, accurate escalation, and well-documented resolution processes.",
        svc_coord_d1: "Escalation management",
        svc_coord_d2: "Cross-functional communication",
        svc_coord_d3: "Resolution documentation",
        svc_coord_d4: "Client-facing coordination",
        workflow_title: "Workflow",
        workflow_desc: "My structured approach to handling support requests and technical issues.",
        wf_receive: "Receive Request",
        wf_receive_desc: "Receiving tickets, reports, or service requests from users through the designated support channel.",
        wf_analyze: "Analyze",
        wf_analyze_desc: "Conducting an initial investigation and identifying the root cause of the reported issue.",
        wf_troubleshoot: "Troubleshoot",
        wf_troubleshoot_desc: "Checking system logs, configurations, and related data to identify and isolate the source of the problem.",
        wf_resolve: "Resolve",
        wf_resolve_desc: "Providing a direct solution or performing corrective actions to restore normal service operation.",
        wf_escalate: "Escalate",
        wf_escalate_desc: "Escalating to the relevant team when the issue requires higher-level expertise or cross-team involvement.",
        wf_validate: "Validate",
        wf_validate_desc: "Confirming with the user that the solution is working correctly and that the issue has been fully resolved.",
        wf_document: "Document",
        wf_document_desc: "Recording the resolution details and updating the ticket status to maintain accurate service records.",
        ai_title: "AI & Automation",
        ai_desc: "Exploring intelligent workflows and automation systems.",
        ai_body: "I actively explore AI-assisted workflows — from prompt engineering and content generation to image enhancement and intelligent automation systems. My goal is to leverage these tools to improve productivity, accelerate creative output, and build smarter digital experiences that feel effortless to use.",
        ai_tag1: "Prompt Engineering",
        ai_tag2: "Image Enhancement",
        ai_tag3: "Content Generation",
        ai_tag4: "Automation Systems",
        ai_tag5: "Workflow Optimization",
        techstack_title: "Tech Stack",
        techstack_desc: "Tools and technologies I use across support, development, and administration.",
        tech_support_tools: "Support Tools",
        tech_webdev: "Web Development",
        tech_productivity: "Productivity",
        tech_design: "Design",
        skills_title: "Skills & Competencies",
        skills_desc: "Core competencies and tools I work with professionally.",
        skill_technical: "Technical Support & IT Operations",
        skill_webdev: "Web Development",
        skill_soft: "Soft Skills",
        skill_tools: "Tools",
        services_title: "Services",
        services_desc: "What I bring to the table — from daily operations to complex technical challenges.",
        milestones_title: "Career Journey",
        milestones_desc: "Key moments that shaped my professional journey.",
        ms1_title: "Graduated from Vocational High School",
        ms1_desc: "Completed secondary education at SMK Tamansiswa Jetis Yogyakarta, majoring in Computer and Network Engineering.",
        ms2_title: "First Work Experience",
        ms2_desc: "Began first professional experience as a waiter in the F&B industry, developing strong interpersonal and customer service skills.",
        ms3_title: "Joined University Cooperative",
        ms3_desc: "Joined the Student Cooperative of Universitas PGRI Yogyakarta as Administration and Public Relations Staff.",
        ms4_title: "Internship in System Development",
        ms4_desc: "Completed an internship at PT Yogya Kristal Sejati as an Admin and Warehouse Data System Developer.",
        ms5_title: "Completed Bachelor's Degree",
        ms5_desc: "Graduated with a Bachelor's Degree in Informatics from Universitas PGRI Yogyakarta with a GPA of 3.61.",
        ms6_title: "Entered the Digital Support Industry",
        ms6_desc: "Started a professional career in the customer engagement support field for digital platforms.",
        ms7_title: "Joined Ivosights as Technical Support",
        ms7_desc: "Joined Ivosights as a Technical Support specialist, handling troubleshooting, incident management, and client coordination.",
        ms8_title: "Enterprise Product Support",
        ms8_desc: "Handled implementations and support for Sociomile Omni, Sociomile Voice, IVO WABA, and Ripple10 across national enterprise clients.",
        ms9_title: "Transitioned to Helpdesk Specialist",
        ms9_desc: "Transitioned to the Customer Experience & Growth division as a Helpdesk Specialist, focusing on SLA compliance and user satisfaction.",
        page_about_title: "About Me",
        page_about_desc: "The person behind the work.",
        about_bio_title: "Who am I?",
        about_bio_text: "I am an Information Technology professional with a Bachelor's degree in Informatics and experience spanning technical support, helpdesk operations, customer experience, system administration, and web development. My career began in customer service and digital customer support before evolving into technical support and helpdesk roles focused on incident handling, troubleshooting, root-cause analysis, and the implementation of technology solutions for large-scale organizations. With a strong foundation in computer networking, system development, and customer service management, I thrive in dynamic, collaborative, and solution-oriented environments. I have a strong passion for technology, web application development, and user experience improvement, with a commitment to continuous learning, adaptability, and delivering practical solutions that create meaningful value for both users and organizations.",
        about_exp_title: "Work Experience",
        about_exp1_role: "Technical Support / Helpdesk Specialist",
        about_exp1_period: "Nov 2022 – Present",
        about_exp1_desc: "Handling technical troubleshooting, incident management, and client coordination for enterprise products including Sociomile Omni, Sociomile Voice, IVO WABA, and Ripple10.",
        about_exp2_role: "Customer Service",
        about_exp2_period: "Oct 2022 – Nov 2022",
        about_exp2_desc: "Providing chat-based customer service, handling user inquiries and resolving issues in accordance with service procedures.",
        about_exp3_role: "Customer Engagement Champion",
        about_exp3_period: "Oct 2021 – May 2022",
        about_exp3_desc: "Handling customer service via chat platform, assisting users with service issues and providing accurate product information.",
        about_exp4_role: "Administration Intern",
        about_exp4_period: "2019",
        about_exp4_desc: "Developed a warehouse data management system and supported day-to-day administrative and operational activities.",
        about_exp5_role: "Server / Waiter",
        about_exp5_period: "2017 – 2018",
        about_exp5_desc: "Delivered quality customer service and supported daily restaurant operations.",
        about_edu_title: "Education",
        about_edu1_degree: "Bachelor's Degree — Informatics",
        about_edu1_period: "2016 – 2021",
        about_edu1_desc: "Universitas PGRI Yogyakarta · GPA 3.61 / 4.00 · Final Thesis: \"Decision Support System for Fogging Area Determination in Jetis District, Yogyakarta.\"",
        about_edu2_degree: "Computer and Network Engineering",
        about_edu2_period: "2013 – 2016",
        about_edu2_desc: "SMK Tamansiswa Jetis Yogyakarta.",
        qf_location: "Location",
        qf_role: "Current Role",
        qf_company: "Company",
        qf_education: "Education",
        qf_experience: "Experience",
        qf_experience_val: "4+ Years in IT Support",
        page_achievements_title: "Certifications & Achievements",
        page_achievements_desc: "Milestones, certifications, and recognitions.",
        ach_academic_title: "Academic Achievement",
        ach_academic: "Bachelor's Degree in Informatics — Universitas PGRI Yogyakarta · Graduated 2021 · GPA 3.61 / 4.00",
        ach_professional_title: "Professional Achievement",
        ach_professional: "Handled technical support for national enterprise clients, consistently met SLA standards, and served as part of a 24/7 helpdesk operations team.",
        ach_cert1_title: "English Proficiency Test",
        ach_cert1: "Certification of English language proficiency — 2019",
        ach_cert2_title: "Digital Business Skills",
        ach_cert2: "Sertifikat Kompetensi Keterampilan Bisnis Digital — 2019",
        page_prof_projects_title: "Professional Projects",
        page_prof_projects_desc: "Key projects and responsibilities from my professional career.",
        page_projects_title: "Web Development Projects",
        page_projects_desc: "Selected web projects that showcase my development skills.",
        proj_bookmark_title: "Bookmark Manager",
        proj_bookmark_desc: "Privacy-first browser bookmark manager with local storage using IndexedDB. Supports folder hierarchy, duplicate detection, and domain analytics.",
        proj_bookmark_detail_desc: "A privacy-first browser bookmark manager with local storage using IndexedDB. Features include bookmark import/export, folder hierarchy, duplicate detection, domain analytics, multi-language support, and dark mode — all processed locally with no server uploads.",
        proj_bookmark_gallery_main: "Bookmark Overview",
        proj_bookmark_gallery_1: "Folder Hierarchy",
        proj_bookmark_gallery_2: "Domain Analytics",
        proj_insta_title: "InstaAnalyzer",
        proj_insta_desc: "Browser-based Instagram data analysis app that processes Instagram export files locally without uploading data to any server.",
        proj_insta_detail_desc: "Browser-based Instagram data analysis app that processes Instagram export ZIP files entirely on the client side. Features followers analysis, following analysis, fan detection, and local-only processing with zero server uploads.",
        proj_insta_gallery_main: "Analysis Dashboard",
        proj_insta_gallery_1: "Followers Analysis",
        proj_insta_gallery_2: "Privacy-First",
        proj_dss_title: "DSS — Fogging Area Prioritization",
        proj_dss_desc: "Decision support system to help health agencies determine priority areas for fogging operations based on health and environmental parameters using the TOPSIS method.",
        proj_dss_detail_desc: "Web-based decision support system developed to assist health agencies in prioritizing fogging intervention areas using the TOPSIS multi-criteria decision-making method.",
        proj_dss_meta: "Undergraduate Thesis · Universitas PGRI Yogyakarta",
        proj_ginger_title: "DSS — Ginger Farmland Selection (AHP-TOPSIS)",
        proj_ginger_desc: "Decision support system for selecting optimal ginger farmland in Gunungkidul using combined AHP-TOPSIS methods.",
        proj_ginger_detail_desc: "Decision support system developed to help agricultural stakeholders in Gunungkidul Regency select the most suitable land for ginger cultivation. The system combines the Analytical Hierarchy Process (AHP) for criteria weighting with TOPSIS for ranking and selecting the optimal land alternatives based on soil quality, land area, accessibility, water availability, and other agricultural criteria.",
        proj_ginger_meta: "Academic Project · Gunungkidul Region",
        prof_warehouse_title: "Warehouse Administration System",
        prof_warehouse_desc: "Warehouse data recording system built during internship at PT Yogya Kristal Sejati to support inventory management and data administration.",
        prof_warehouse_meta: "Internship · PT Yogya Kristal Sejati",
        prof_proj2_title: "DSS — Village Cash Assistance Recipients",
        prof_proj2_desc: "Decision support system to help village governments determine eligible recipients for direct cash assistance (BLT) based on established criteria using the TOPSIS method.",
        prof_proj2_meta: "Academic Project",
        prof_proj3_title: "Expert System — Oyster Mushroom Diagnosis",
        prof_proj3_desc: "Expert system to help users identify pests and diseases in oyster mushroom cultivation and provide handling recommendations.",
        prof_proj3_meta: "Contribution: UI & Frontend Development",
        proj_view_showcase: "View Showcase",
        proj_demo: "Demo",
        proj_code: "Code",
        proj_back: "Back to Projects",
        proj_live_demo: "Live Demo",
        proj_view_code: "View Code",
        page_contact_title: "Contact",
        page_contact_desc: "Let's build something amazing together.",
        form_name: "Full Name",
        form_email: "Email Address",
        form_message: "Message",
        form_send: "Send Message",
        form_name_placeholder: "Amanda Gabriella",
        form_email_placeholder: "hello@example.com",
        form_message_placeholder: "Your message here...",
        contact_address: "South Jakarta, Indonesia",
        cv_download: "Download CV",
    },

    id: {
        nav_home: "Beranda",
        nav_about: "Tentang",
        nav_services: "Layanan",
        nav_projects: "Proyek",
        nav_contact: "Kontak",
        profile_role: "Technical Support Specialist",
        footer_made: "Dibuat dengan",
        footer_by: "oleh",
        hero_greeting: "Halo,",
        hero_im: "Saya",
        hero_location: "Jakarta Selatan, Indonesia",
        position_1: "Technical Support Specialist",
        position_2: "Helpdesk Engineer",
        position_3: "IT Operations Support",
        hero_summary: "Technical Support & Helpdesk Specialist dengan pengalaman 4+ tahun menangani sistem enterprise, incident management, dan operasional berbasis SLA untuk klien skala nasional.",
        hero_cta_contact: "Hubungi Saya",
        hero_cta_projects: "Lihat Proyek",
        stat_years: "Tahun Pengalaman",
        stat_clients: "Klien Enterprise",
        stat_products: "Produk Didukung",
        stat_projects: "Proyek Dev",
        home_services_title: "Yang Saya Lakukan",
        home_services_desc: "Area keahlian utama.",
        home_services_link: "Lihat layanan lengkap →",
        home_projects_title: "Featured Projects",
        home_projects_desc: "Karya terpilih.",
        home_projects_link: "Lihat semua proyek →",
        cta_strip_title: "Siap bekerja sama?",
        cta_strip_desc: "Saya terbuka untuk peluang baru, kolaborasi, dan proyek-proyek menarik.",
        cta_strip_contact: "Hubungi Saya",
        cta_strip_about: "Pelajari Lebih Lanjut",
        svc_support_title: "Technical Support",
        svc_support_short: "Troubleshooting, incident management, dan root cause analysis untuk aplikasi enterprise.",
        svc_support_desc: "Menangani masalah teknis terkait aplikasi dan sistem, melakukan troubleshooting dan analisis akar masalah untuk menyelesaikan insiden secara efektif.",
        svc_support_d1: "Triase & resolusi insiden",
        svc_support_d2: "Laporan root cause analysis",
        svc_support_d3: "Remote & on-site troubleshooting",
        svc_support_d4: "Review log sistem & diagnosis",
        svc_helpdesk_title: "Helpdesk Operations",
        svc_helpdesk_short: "Pengelolaan tiket berbasis SLA dan bantuan teknis untuk pengguna.",
        svc_helpdesk_desc: "Memberikan bantuan teknis kepada pengguna, mengelola tiket dan permintaan layanan sesuai standar SLA, serta memastikan penyelesaian tepat waktu.",
        svc_helpdesk_d1: "Penanganan tiket sesuai SLA",
        svc_helpdesk_d2: "Bantuan teknis end-user",
        svc_helpdesk_d3: "Manajemen permintaan layanan",
        svc_helpdesk_d4: "Dukungan operasional 24/7",
        svc_webdev_title: "Web Development",
        svc_webdev_short: "Aplikasi web fungsional dengan HTML, CSS, PHP, dan MySQL dari desain hingga deployment.",
        svc_webdev_desc: "Membangun aplikasi web fungsional menggunakan HTML, CSS, PHP, dan MySQL — mulai dari analisis kebutuhan dan perancangan sistem hingga implementasi.",
        svc_webdev_d1: "Analisis kebutuhan & perencanaan",
        svc_webdev_d2: "Pengembangan front-end responsif",
        svc_webdev_d3: "Sistem back-end PHP & MySQL",
        svc_webdev_d4: "Aplikasi CRUD & manajemen data",
        svc_coord_title: "Cross-Team Coordination",
        svc_coord_short: "Menjembatani developer, account manager, dan tim bisnis untuk kelancaran layanan.",
        svc_coord_desc: "Berkoordinasi dengan tim developer, account manager, dan bisnis untuk memastikan kelancaran layanan, eskalasi yang tepat, dan proses penyelesaian yang terdokumentasi.",
        svc_coord_d1: "Manajemen eskalasi",
        svc_coord_d2: "Komunikasi lintas fungsi",
        svc_coord_d3: "Dokumentasi resolusi",
        svc_coord_d4: "Koordinasi berhadapan klien",
        workflow_title: "Alur Kerja",
        workflow_desc: "Pendekatan terstruktur saya dalam menangani permintaan support dan masalah teknis.",
        wf_receive: "Terima Permintaan",
        wf_receive_desc: "Menerima tiket, laporan, atau permintaan layanan dari pengguna melalui saluran support yang tersedia.",
        wf_analyze: "Analisis",
        wf_analyze_desc: "Melakukan investigasi awal dan mengidentifikasi akar masalah dari insiden yang dilaporkan.",
        wf_troubleshoot: "Troubleshoot",
        wf_troubleshoot_desc: "Memeriksa log sistem, konfigurasi, dan data terkait untuk mengidentifikasi dan mengisolasi sumber masalah.",
        wf_resolve: "Penyelesaian",
        wf_resolve_desc: "Memberikan solusi langsung atau melakukan tindakan korektif untuk memulihkan operasional layanan.",
        wf_escalate: "Eskalasi",
        wf_escalate_desc: "Melakukan eskalasi ke tim terkait apabila masalah memerlukan keahlian lebih tinggi atau keterlibatan lintas tim.",
        wf_validate: "Validasi",
        wf_validate_desc: "Mengonfirmasi kepada pengguna bahwa solusi telah berjalan dengan baik dan masalah telah sepenuhnya terselesaikan.",
        wf_document: "Dokumentasi",
        wf_document_desc: "Mencatat detail penyelesaian dan memperbarui status tiket untuk menjaga keakuratan catatan layanan.",
        ai_title: "AI & Automation",
        ai_desc: "Menjelajahi intelligent workflow dan sistem otomasi.",
        ai_body: "Saya aktif mengeksplorasi alur kerja berbasis AI — mulai dari prompt engineering dan pembuatan konten hingga image enhancement dan sistem otomasi cerdas. Tujuan saya adalah memanfaatkan tools ini untuk meningkatkan produktivitas, mempercepat creative output, dan membangun pengalaman digital yang lebih cerdas serta terasa mudah digunakan.",
        ai_tag1: "Prompt Engineering",
        ai_tag2: "Image Enhancement",
        ai_tag3: "Content Generation",
        ai_tag4: "Automation Systems",
        ai_tag5: "Workflow Optimization",
        techstack_title: "Tech Stack",
        techstack_desc: "Tools dan teknologi yang saya gunakan dalam support, pengembangan, dan administrasi.",
        tech_support_tools: "Support Tools",
        tech_webdev: "Web Development",
        tech_productivity: "Productivity",
        tech_design: "Design",
        skills_title: "Keahlian & Kompetensi",
        skills_desc: "Kompetensi inti dan tools yang saya gunakan secara profesional.",
        skill_technical: "Technical Support & IT Operations",
        skill_webdev: "Web Development",
        skill_soft: "Soft Skills",
        skill_tools: "Tools",
        services_title: "Layanan",
        services_desc: "Yang saya tawarkan — dari operasional harian hingga tantangan teknis yang kompleks.",
        milestones_title: "Perjalanan Karier",
        milestones_desc: "Momen-momen kunci yang membentuk perjalanan profesional saya.",
        ms1_title: "Lulus SMK",
        ms1_desc: "Menyelesaikan pendidikan menengah di SMK Tamansiswa Jetis Yogyakarta, jurusan Teknik Komputer dan Jaringan.",
        ms2_title: "Pengalaman Kerja Pertama",
        ms2_desc: "Memulai pengalaman profesional pertama sebagai waiter di industri F&B, mengembangkan keterampilan interpersonal dan pelayanan pelanggan.",
        ms3_title: "Bergabung dengan Koperasi Mahasiswa",
        ms3_desc: "Bergabung dengan Koperasi Mahasiswa Universitas PGRI Yogyakarta sebagai Staff Administrasi dan Humas.",
        ms4_title: "Magang Pengembangan Sistem",
        ms4_desc: "Magang di PT Yogya Kristal Sejati sebagai Admin dan Pengembang Sistem Pendataan Gudang.",
        ms5_title: "Menyelesaikan Pendidikan Sarjana",
        ms5_desc: "Lulus Sarjana Informatika dari Universitas PGRI Yogyakarta dengan IPK 3.61.",
        ms6_title: "Memasuki Industri Digital Support",
        ms6_desc: "Memulai karier profesional di bidang customer engagement support untuk platform digital.",
        ms7_title: "Bergabung dengan Ivosights",
        ms7_desc: "Bergabung dengan Ivosights sebagai Technical Support, menangani troubleshooting, incident management, dan koordinasi klien.",
        ms8_title: "Enterprise Product Support",
        ms8_desc: "Menangani implementasi dan support untuk Sociomile Omni, Sociomile Voice, IVO WABA, dan Ripple10 untuk berbagai klien enterprise nasional.",
        ms9_title: "Transisi ke Helpdesk Specialist",
        ms9_desc: "Beralih ke divisi Customer Experience & Growth sebagai Helpdesk Specialist, berfokus pada kepatuhan SLA dan kepuasan pengguna.",
        page_about_title: "Tentang Saya",
        page_about_desc: "Sosok di balik pekerjaan.",
        about_bio_title: "Who am I?",
        about_bio_text: "Saya adalah seorang profesional di bidang teknologi informasi dengan latar belakang Sarjana Informatika dan pengalaman yang mencakup technical support, helpdesk operations, customer experience, administrasi sistem, serta web development. Perjalanan karier saya dimulai dari layanan pelanggan dan customer support digital, kemudian berkembang ke peran technical support dan helpdesk yang berfokus pada penanganan insiden, troubleshooting, analisis masalah, serta dukungan implementasi berbagai solusi teknologi untuk perusahaan skala nasional. Berbekal fondasi di bidang jaringan komputer, pengembangan sistem, dan pengelolaan layanan pelanggan, saya terbiasa bekerja di lingkungan yang dinamis, kolaboratif, dan berorientasi solusi. Saya memiliki minat yang kuat terhadap teknologi, pengembangan aplikasi web, serta peningkatan pengalaman pengguna, dengan komitmen untuk terus belajar, beradaptasi, dan menghadirkan solusi yang memberikan nilai nyata bagi pengguna maupun organisasi.",
        about_exp_title: "Pengalaman Kerja",
        about_exp1_role: "Technical Support / Helpdesk Specialist",
        about_exp1_period: "Nov 2022 – Sekarang",
        about_exp1_desc: "Menangani troubleshooting teknis, incident management, dan koordinasi klien untuk produk enterprise termasuk Sociomile Omni, Sociomile Voice, IVO WABA, dan Ripple10.",
        about_exp2_role: "Customer Service",
        about_exp2_period: "Okt 2022 – Nov 2022",
        about_exp2_desc: "Memberikan layanan pelanggan berbasis chat, menangani pertanyaan pengguna dan menyelesaikan masalah sesuai prosedur layanan.",
        about_exp3_role: "Customer Engagement Champion",
        about_exp3_period: "Okt 2021 – Mei 2022",
        about_exp3_desc: "Menangani layanan pelanggan melalui platform chat, membantu pengguna menyelesaikan kendala layanan dan memberikan informasi produk secara akurat.",
        about_exp4_role: "Administration Intern",
        about_exp4_period: "2019",
        about_exp4_desc: "Mengembangkan sistem pendataan gudang dan mendukung kegiatan administrasi serta operasional harian perusahaan.",
        about_exp5_role: "Server / Waiter",
        about_exp5_period: "2017 – 2018",
        about_exp5_desc: "Memberikan pelayanan pelanggan yang berkualitas dan mendukung operasional restoran harian.",
        about_edu_title: "Pendidikan",
        about_edu1_degree: "Sarjana — Informatika",
        about_edu1_period: "2016 – 2021",
        about_edu1_desc: "Universitas PGRI Yogyakarta · IPK 3.61 / 4.00 · Skripsi: \"Sistem Pendukung Keputusan Penentuan Wilayah Layak Fogging di Kecamatan Jetis Yogyakarta.\"",
        about_edu2_degree: "Teknik Komputer dan Jaringan",
        about_edu2_period: "2013 – 2016",
        about_edu2_desc: "SMK Tamansiswa Jetis Yogyakarta.",
        qf_location: "Lokasi",
        qf_role: "Posisi Saat Ini",
        qf_company: "Perusahaan",
        qf_education: "Pendidikan",
        qf_experience: "Pengalaman",
        qf_experience_val: "4+ Tahun di IT Support",
        page_achievements_title: "Sertifikasi & Pencapaian",
        page_achievements_desc: "Tonggak pencapaian, sertifikasi, dan pengakuan.",
        ach_academic_title: "Prestasi Akademik",
        ach_academic: "Sarjana Informatika — Universitas PGRI Yogyakarta · Lulus 2021 · IPK 3.61 / 4.00",
        ach_professional_title: "Prestasi Profesional",
        ach_professional: "Menangani technical support untuk berbagai klien enterprise nasional, konsisten memenuhi standar SLA, dan menjadi bagian dari tim helpdesk operasional 24/7.",
        ach_cert1_title: "English Proficiency Test",
        ach_cert1: "Sertifikat kemampuan bahasa Inggris — 2019",
        ach_cert2_title: "Digital Business Skills",
        ach_cert2: "Sertifikat Kompetensi Keterampilan Bisnis Digital — 2019",
        page_prof_projects_title: "Professional Projects",
        page_prof_projects_desc: "Proyek dan tanggung jawab utama dari perjalanan karier profesional saya.",
        page_projects_title: "Web Development Projects",
        page_projects_desc: "Karya terpilih yang menunjukkan keahlian web development saya.",
        proj_bookmark_title: "Bookmark Manager",
        proj_bookmark_desc: "Browser bookmark manager berbasis privacy-first dengan penyimpanan lokal menggunakan IndexedDB. Mendukung hierarki folder, deteksi duplikat, dan analitik domain.",
        proj_bookmark_detail_desc: "Browser bookmark manager berbasis privacy-first dengan penyimpanan lokal menggunakan IndexedDB. Fitur meliputi import/export bookmark, hierarki folder, deteksi duplikat, analitik domain, dukungan multi-bahasa, dan dark mode — semua diproses secara lokal tanpa upload ke server.",
        proj_bookmark_gallery_main: "Ikhtisar Bookmark",
        proj_bookmark_gallery_1: "Hierarki Folder",
        proj_bookmark_gallery_2: "Analitik Domain",
        proj_insta_title: "InstaAnalyzer",
        proj_insta_desc: "Aplikasi analisis data Instagram berbasis browser yang memproses file ekspor Instagram secara lokal tanpa upload ke server.",
        proj_insta_detail_desc: "Aplikasi analisis data Instagram berbasis browser yang memproses file ZIP ekspor Instagram sepenuhnya di sisi klien. Fitur analisis followers, following, deteksi fan, dan pemrosesan lokal tanpa upload ke server.",
        proj_insta_gallery_main: "Dashboard Analisis",
        proj_insta_gallery_1: "Analisis Followers",
        proj_insta_gallery_2: "Privacy-First",
        proj_dss_title: "DSS — Prioritas Wilayah Fogging",
        proj_dss_desc: "Sistem pendukung keputusan yang membantu instansi kesehatan menentukan wilayah prioritas fogging menggunakan metode TOPSIS.",
        proj_dss_detail_desc: "Sistem pendukung keputusan berbasis web yang dikembangkan untuk membantu instansi kesehatan menentukan prioritas wilayah fogging menggunakan metode TOPSIS.",
        proj_dss_meta: "Skripsi Sarjana · Universitas PGRI Yogyakarta",
        proj_ginger_title: "DSS — Pemilihan Lahan Pertanian Jahe (AHP-TOPSIS)",
        proj_ginger_desc: "Sistem pendukung keputusan untuk memilih lahan pertanian jahe yang optimal di wilayah Gunungkidul menggunakan kombinasi metode AHP-TOPSIS.",
        proj_ginger_detail_desc: "Sistem pendukung keputusan yang dikembangkan untuk membantu para pemangku kepentingan pertanian di Kabupaten Gunungkidul dalam memilih lahan yang paling sesuai untuk budidaya tanaman jahe. Sistem ini mengombinasikan metode Analytical Hierarchy Process (AHP) untuk pembobotan kriteria dengan metode TOPSIS untuk perankingan dan penentuan alternatif lahan terbaik berdasarkan kriteria kualitas tanah, luas lahan, aksesibilitas, ketersediaan air, dan kriteria pertanian lainnya.",
        proj_ginger_meta: "Proyek Akademik · Wilayah Gunungkidul",
        prof_warehouse_title: "Sistem Administrasi Gudang",
        prof_warehouse_desc: "Sistem pendataan gudang yang dibangun saat magang di PT Yogya Kristal Sejati untuk mendukung manajemen inventaris dan administrasi data.",
        prof_warehouse_meta: "Magang · PT Yogya Kristal Sejati",
        prof_proj2_title: "SPK — Penerima BLT Desa",
        prof_proj2_desc: "Sistem pendukung keputusan yang membantu pemerintah desa menentukan calon penerima Bantuan Langsung Tunai (BLT) berdasarkan kriteria yang telah ditetapkan menggunakan metode TOPSIS.",
        prof_proj2_meta: "Proyek Akademik",
        prof_proj3_title: "Sistem Pakar — Diagnosa Jamur Tiram",
        prof_proj3_desc: "Sistem pakar untuk membantu pengguna mengidentifikasi penyakit dan hama pada budidaya jamur tiram serta memberikan rekomendasi penanganan.",
        prof_proj3_meta: "Kontribusi: Pengembangan UI & Frontend",
        proj_view_showcase: "Lihat Showcase",
        proj_demo: "Demo",
        proj_code: "Kode",
        proj_back: "Kembali ke Proyek",
        proj_live_demo: "Demo Langsung",
        proj_view_code: "Lihat Kode",
        page_contact_title: "Kontak",
        page_contact_desc: "Mari membangun sesuatu yang luar biasa bersama.",
        form_name: "Nama Lengkap",
        form_email: "Alamat Email",
        form_message: "Pesan",
        form_send: "Kirim Pesan",
        form_name_placeholder: "Rania Kurnia Dewi",
        form_email_placeholder: "halo@contoh.com",
        form_message_placeholder: "Pesan kamu di sini...",
        contact_address: "Jakarta Selatan, Indonesia",
        cv_download: "Unduh CV",
    },
};

// ─── LANGUAGE ──────────────────────────────────────────────────────────────

function initLanguage() {
    const savedLang = localStorage.getItem("lang") || "en";
    applyLanguage(savedLang);

    document.querySelectorAll(".lang button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === savedLang);
        btn.addEventListener("click", () => {
            document.querySelectorAll(".lang button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            applyLanguage(btn.dataset.lang);
        });
    });
}

function applyLanguage(lang) {
    const dictionary = translations[lang];
    if (!dictionary) return;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
            el.textContent = dictionary[key];
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
            el.placeholder = dictionary[key];
        }
    });

    refreshHeroTranslations(lang);
    localStorage.setItem("lang", lang);

    const mobileLangLabel = document.getElementById("mobileLangLabel");
    if (mobileLangLabel) mobileLangLabel.textContent = lang.toUpperCase();

    document.querySelectorAll(".lang button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });
}

function refreshHeroTranslations(lang) {
    const dictionary = translations[lang];
    if (!dictionary) return;

    document.querySelectorAll(".hero [data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (dictionary[key] !== undefined) el.textContent = dictionary[key];
    });

    requestAnimationFrame(() => {
        document.querySelectorAll(".hero-meta div").forEach(div => {
            div.style.transform = "translateZ(0)";
            void div.offsetWidth;
            div.style.transform = "";
        });

        const h1 = document.querySelector(".hero h1");
        if (h1) {
            h1.style.opacity = "0.99";
            void h1.offsetWidth;
            h1.style.opacity = "";
        }
    });
}

// ─── PARALLAX ──────────────────────────────────────────────────────────────

function initParallax() {
    if (window.innerWidth < 992 || "ontouchstart" in window) return;

    document.querySelectorAll(".card, .project-card, .achievement-card").forEach(card => {
        card.addEventListener("mousemove", e => {
            const rect = card.getBoundingClientRect();
            const rotateX = ((e.clientY - rect.top - rect.height / 2) / 50) * -1;
            const rotateY = (e.clientX - rect.left - rect.width / 2) / 50;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        card.addEventListener("mouseenter", () => {
            card.style.transition = "transform 0.18s cubic-bezier(0.22,1,0.36,1)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.transition = "transform 0.6s cubic-bezier(0.22,1,0.36,1)";
            card.style.transform = "";
        });
    });
}

// ─── SCROLL REVEAL ─────────────────────────────────────────────────────────

let _scrollRevealObserver = null;

function initScrollReveal() {
    if (_scrollRevealObserver) {
        _scrollRevealObserver.disconnect();
        _scrollRevealObserver = null;
    }

    const activePage = document.querySelector(".page.active");
    if (!activePage) return;

    const revealElements = activePage.querySelectorAll(
        ".stat, .skill, .card, .achievement-card, .project-card, .about-bio-card, .service-card, .tech-group, .milestone-item, .home-project-card, .home-service-item, .exp-timeline-item, .edu-item, .quick-fact"
    );
    if (!revealElements.length) return;

    _scrollRevealObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    _scrollRevealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    revealElements.forEach(el => {
        if (el.style.opacity !== "1") {
            el.style.opacity = "0";
            if (!el.classList.contains("workflow-step")) {
                el.style.transform = "translateY(20px)";
                el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
            }
        }
        _scrollRevealObserver.observe(el);
    });
}

// ─── STATS COUNTER ─────────────────────────────────────────────────────────

function initStatsCounter() {
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const animateCounter = (h2, number, delay = 0) => {
        setTimeout(() => {
            const duration = 1200;
            const startTime = performance.now();

            const tick = now => {
                const progress = Math.min((now - startTime) / duration, 1);
                h2.innerText = Math.floor(easeOutCubic(progress) * number) + "+";

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    h2.innerText = number + "+";
                    h2.classList.add("stat-done");
                    setTimeout(() => h2.classList.remove("stat-done"), 600);
                    delete h2.dataset.animating;
                }
            };

            requestAnimationFrame(tick);
        }, delay);
    };

    const statsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const h2 = entry.target.querySelector("h2");
            if (h2 && !h2.dataset.animating) {
                h2.dataset.animating = "true";
                const rawValue = h2.dataset.target || h2.innerText.replace("+", "").trim();
                h2.dataset.target = rawValue;
                const number = parseInt(rawValue);
                const index = [...document.querySelectorAll(".stat")].indexOf(entry.target);
                if (!isNaN(number)) animateCounter(h2, number, index * 150);
            }
            statsObserver.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll(".stat").forEach(stat => statsObserver.observe(stat));
}

// ─── HERO ANIMATIONS ───────────────────────────────────────────────────────

function initAnimations() {
    const heroTitle = document.querySelector(".hero h1");
    if (heroTitle) {
        heroTitle.style.cssText = "opacity:0; transform:translateY(30px); transition:opacity 0.8s ease, transform 0.8s ease";
        setTimeout(() => {
            heroTitle.style.opacity = "1";
            heroTitle.style.transform = "translateY(0)";
        }, 80);
    }

    const heroItems = document.querySelectorAll(".hero-meta > div");
    heroItems.forEach((item, index) => {
        const delay = 0.1 + index * 0.08;
        item.style.cssText = `opacity:0; transform:translateY(15px); transition:opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`;
        setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "translateY(0)";
        }, 300);
    });

    const heroSummary = document.querySelector(".hero-summary");
    if (heroSummary) {
        const delay = 0.1 + heroItems.length * 0.08 + 0.1;
        heroSummary.style.cssText = `opacity:0; transform:translateY(15px); transition:opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`;
        setTimeout(() => {
            heroSummary.style.opacity = "1";
            heroSummary.style.transform = "translateY(0)";
        }, 300);
    }

    const heroCta = document.querySelector(".hero-cta-group");
    if (heroCta) {
        const delay = 0.1 + heroItems.length * 0.08 + 0.3;
        heroCta.style.cssText = `opacity:0; transform:translateY(15px); transition:opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`;
        setTimeout(() => {
            heroCta.style.opacity = "1";
            heroCta.style.transform = "translateY(0)";
        }, 300);
    }
}

// ─── CONTACT FORM ──────────────────────────────────────────────────────────

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch(
            'https://formspree.io/f/xwvjzblg',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            }
        );

        if (response.ok) {
            this.showNotification('Message sent successfully!', 'success');
            contactForm.reset();
        } else {
            this.showNotification('Failed to send message.', 'error');
        }
    } catch (error) {
        this.showNotification('Failed to send message.', 'error');
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
});

// ─── BURGER MENU ───────────────────────────────────────────────────────────

function initBurgerMenu() {
    const burgerBtn = document.getElementById("burgerBtn");
    const navOverlay = document.getElementById("navOverlay");
    if (!burgerBtn || !navOverlay) return;

    const openOverlay = () => {
        navOverlay.classList.add("open");
        navOverlay.setAttribute("aria-hidden", "false");
        burgerBtn.classList.add("open");
        burgerBtn.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    };

    const closeOverlay = () => {
        navOverlay.classList.remove("open");
        navOverlay.setAttribute("aria-hidden", "true");
        burgerBtn.classList.remove("open");
        burgerBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    };

    burgerBtn.addEventListener("click", () => {
        navOverlay.classList.contains("open") ? closeOverlay() : openOverlay();
    });

    navOverlay.querySelectorAll(".nav-overlay__link").forEach(link => {
        link.addEventListener("click", closeOverlay);
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && navOverlay.classList.contains("open")) closeOverlay();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 1024) closeOverlay();
    });
}

// ─── MOBILE NAVBAR CONTROLS ────────────────────────────────────────────────

function initMobileNavbarControls() {
    const mobileLangBtn = document.getElementById("mobileLangBtn");
    const mobileLangLabel = document.getElementById("mobileLangLabel");

    if (mobileLangBtn && mobileLangLabel) {
        mobileLangLabel.textContent = (localStorage.getItem("lang") || "en").toUpperCase();
        mobileLangBtn.addEventListener("click", () => {
            const newLang = (localStorage.getItem("lang") || "en") === "en" ? "id" : "en";
            applyLanguage(newLang);
        });
    }

    const mobileThemeBtn = document.getElementById("mobileThemeBtn");
    if (mobileThemeBtn) {
        syncMobileThemeIcon();
        mobileThemeBtn.addEventListener("click", () => {
            applyTheme(document.documentElement.classList.contains("light") ? "dark" : "light");
        });
    }
}

function syncMobileThemeIcon() {
    const mobileThemeBtn = document.getElementById("mobileThemeBtn");
    if (!mobileThemeBtn) return;
    mobileThemeBtn.innerHTML = document.documentElement.classList.contains("light")
        ? '<i class="ri-sun-fill"></i>'
        : '<i class="ri-moon-fill"></i>';
}

// ─── PROJECT DETAIL ────────────────────────────────────────────────────────

function initProjectDetail() {
    document.querySelector("#projects").addEventListener("click", e => {
        const detailBtn = e.target.closest(".project-detail-btn");
        if (detailBtn) { openProjectDetail(detailBtn.dataset.project); return; }

        const backBtn = e.target.closest(".project-detail-back");
        if (backBtn) closeProjectDetail();
    });
}

function openProjectDetail(projectId) {
    const target = document.getElementById(`detail-${projectId}`);
    if (!target) return;

    const parentSection = target.closest(".section");
    if (!parentSection) return;

    // Tutup semua detail view yang mungkin masih active
    document.querySelectorAll(".project-detail-view.active").forEach(el => {
        el.classList.remove("active");
    });

    // Restore semua section dan elemen yang mungkin tersembunyi
    document.querySelectorAll("#projects .section").forEach(s => {
        s.classList.remove("hidden");
        s.querySelectorAll(".projects-grid, .section-title, .section-desc").forEach(el => {
            el.classList.remove("hidden");
        });
    });

    // Baru sembunyikan yang perlu disembunyikan
    parentSection.querySelectorAll(".projects-grid, .section-title, .section-desc").forEach(el => {
        el.classList.add("hidden");
    });

    const otherSection = [...document.querySelectorAll("#projects .section")].find(s => s !== parentSection);
    if (otherSection) otherSection.classList.add("hidden");

    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "auto" });
}

function closeProjectDetail() {
    const activeDetail = document.querySelector(".project-detail-view.active");
    if (!activeDetail) return;

    const parentSection = activeDetail.closest(".section");
    activeDetail.classList.remove("active");

    if (parentSection) {
        parentSection.querySelectorAll(".projects-grid, .section-title, .section-desc").forEach(el => {
            el.classList.remove("hidden");
        });
    }

    document.querySelectorAll("#projects .section").forEach(s => s.classList.remove("hidden"));
    window.scrollTo({ top: 0, behavior: "auto" });
}

// ─── SYNC UI STATE ─────────────────────────────────────────────────────────

function syncAllUIState() {
    const savedLang = localStorage.getItem("lang") || "en";
    syncMobileThemeIcon();
    const mobileLangLabel = document.getElementById("mobileLangLabel");
    if (mobileLangLabel) mobileLangLabel.textContent = savedLang.toUpperCase();
}

// ─── PROJECT GALLERY LIGHTBOX ──────────────────────────────────────────────

function initProjectGalleryLightbox() {
    const lightbox = document.getElementById("projectLightbox");
    const lightboxImage = document.getElementById("projectLightboxImage");
    const closeBtn = document.querySelector(".project-lightbox-close");

    if (!lightbox || !lightboxImage) return;

    let _lightboxTrigger = null;

    const focusableSelectors = "a[href], button, [tabindex]:not([tabindex='-1'])";

    const trapFocus = e => {
        const focusable = [...lightbox.querySelectorAll(focusableSelectors)];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.key === "Tab") {
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        }
    };

    const openLightbox = (img, trigger) => {
        _lightboxTrigger = trigger || null;
        lightboxImage.src = img.src;
        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";
        lightbox.setAttribute("aria-hidden", "false");
        closeBtn?.focus();
        lightbox.addEventListener("keydown", trapFocus);
    };

    const closeLightbox = () => {
        lightbox.classList.remove("active");
        document.body.style.overflow = "";
        lightbox.setAttribute("aria-hidden", "true");
        lightbox.removeEventListener("keydown", trapFocus);
        if (_lightboxTrigger) { _lightboxTrigger.focus(); _lightboxTrigger = null; }
    };

    document.querySelectorAll(".project-gallery-placeholder").forEach(item => {
        item.addEventListener("click", () => {
            const img = item.querySelector("img");
            if (img) openLightbox(img, item);
        });
        item.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const img = item.querySelector("img");
                if (img) openLightbox(img, item);
            }
        });
    });

    closeBtn?.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", e => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && lightbox.classList.contains("active")) closeLightbox();
    });
}