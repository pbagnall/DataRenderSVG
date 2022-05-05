/* description: Parses and executes mathematical expressions. */

/* lexical grammar */

%lex
%s QUOTED
%s DQUOTED
%%

(\\.)                                 return 'ESCAPE'

<INITIAL>"'"                          { this.begin('QUOTED'); return 'QUOTE' }
<QUOTED>[^\\\']+                      { return 'STRING' }
<QUOTED>"'"                           { this.begin('INITIAL'); return 'QUOTE' }

<INITIAL>"\""                         { this.begin('DQUOTED'); return 'DQUOTE' }
<DQUOTED>[^\\\"]+                     { return 'STRING' }
<DQUOTED>"\""                         { this.begin('INITIAL'); return 'DQUOTE' }

\s+                                   /* ignore whitespace */
true|false|TRUE|FALSE                 return 'BOOLEAN'
AND|and                               return 'AND'
OR|or                                 return 'OR'
NOT|not                               return 'NOT'
[0-9]+("."[0-9]+)?\b|("."[0-9]+)\b    return 'NUMBER'
[a-zA-Z][a-zA-Z0-9_"."\s]+            return 'NAME'
\@[a-zA-Z]+                           return 'COLUMN'
"*"                                   return '*'
"/"                                   return '/'
"-"                                   return '-'
"+"                                   return '+'
"^"                                   return '^'
"!="                                  return '!='
"="                                   return '='
"%"                                   return '%'
"("                                   return '('
")"                                   return ')'
"["                                   return '['
"]"                                   return ']'
","                                   return ','
<<EOF>>                               return 'EOF'
.                                     return 'INVALID'

/lex
/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF                  { return $1; }
    | array EOF              { return $1; }
    ;

e
    : NUMBER                 { $$ = () => parseFloat($1); }
    | e '+' e                { $$ = () => $1() + $3(); }
    | e '-' e                { $$ = () => $1() - $3(); }
    | e '*' e                { $$ = () => $1() * $3(); }
    | e '/' e                { $$ = () => $1() / $3(); }
    | e '^' e                { $$ = () => Math.pow($1(), $3()); }
    | '-' e %prec UMINUS     { $$ = () => -$2(); }
    | NAME '(' array ')'     { $$ = () => yy.execute($1, $3()); }
    | NAME                   { $$ = () => yy.variable($1); }
    | COLUMN                 { $$ = () => yy.column($1); }
    | boolExp                { $$ = $1; }
    | '(' e ')'              { $$ = $2; }
    | '[' array ']'          { $$ = $2; }
    | string                 { $$ = $1; }
    ;

string
    : DQUOTE stringWithEscapes DQUOTE   { $$ = () => $2; }
    | QUOTE stringWithEscapes QUOTE     { $$ = () => $2; }
    ;

stringWithEscapes
    : stringWithEscapes ESCAPE STRING    { $$ = $1 + $2.substring(1) + $3; }
    | STRING
    ;

array
    : e ',' e                { $$ = () => [$1(), $3()]; }
    | array ',' e            { $$ = () => [...$1(), $3()]; }
    | e                      { $$ = () => [$1()]; }
    ;

boolExp
    : BOOLEAN                { $$ = () => $1==='true';  }
    | boolExp AND boolExp    { $$ = () => $1() && $3(); }
    | boolExp OR boolExp     { $$ = () => $1() || $3(); }
    | NOT boolExp            { $$ = () => !$2();        }
    | e '=' e                { $$ = () => $1() == $3(); }
    | e '!=' e               { $$ = () => $1() != $3(); }
    ;