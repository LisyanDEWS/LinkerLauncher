awk '
/const openCalculatorWindow =/ {
    print "  const openSupportWindow = () => {"
    print "    wm.open({"
    print "      id: \"support\","
    print "      title: lang === \"ru\" ? \"Поддержка\" : \"Support\","
    print "      icon: <HelpCircle size={14} />,"
    print "      initialWidth: 640,"
    print "      initialHeight: 480,"
    print "      minWidth: 400,"
    print "      minHeight: 300,"
    print "      render: () => <SupportApp lang={lang} theme={theme} />,"
    print "    });"
    print "  };"
    print ""
}
{ print }
' src/App.tsx > tmp_app.tsx && mv tmp_app.tsx src/App.tsx
