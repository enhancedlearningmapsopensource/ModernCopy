<?php
function DbUser(){
    return "elm_debug_user";
}
function DbHost(){
    return "localhost";
}
function DbDatabase(){
    return "elm_release";
}
function DbPass(){
    return "sC&75a[88y2B";
}

function Db(){
    //$server, $database, $username, $password
    return new ElmDatabase(DbHost(), DbDatabase(), DbUser() , DbPass());
}

    function PrivateKey(){
            return "-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQDR73olVDL5yIrfIhJn/rSSPDlYi8J4bG4yAmIo3o4d67+9aFld
QgbjyMZyXlCAG//MhUtCzw8ecEbsSU08bmFt3P8kTYUA9pfT8hK1cFtfGt9/+awE
2X5OATyVyEXmVWXHQRqqaTbj01QbhsuIkad/+5RVknPiEF/SDm//re2zjwIDAQAB
AoGALPpKyB6fAUcHAcFSAjfexgnjG2ZuFtDcVxiNoUX1WtG8db8ajlFsGndUlQJB
6wCUsGPKeRjVm2bguxUFWDIp6zV01/Gg7Z49PNX3Mnjnp52kEj6Y/7qORVR4kVlR
4Dwy3qIzht7ixnhpkqoFjV50gN/N3Ly7NtDhj/8l7sUsktECQQDtpmOEYV3pFuTk
obal26YKRQkVdGYp1aHCX2jTIZTRw6LgLufm78x77KpwHEYJPGoAqSfOw08v4Owi
cYw84BU5AkEA4iVB+Kervxt4NeX3QlsaWN0ftecZmS2uACWLAH8a8YkvY754Kw+M
jbek8t9U1ocjr2xmSsFyZ0fEDS2VPg0XBwJBAIuyDzW19noZ1xr+ZFtCrmvDAP/3
mEZnKdsUMo5JYy2bDpcxe2go9c6y481bEWBEfxs8VAYakOXYFXZ5wLHYFyECQHbF
gqSJy1YPo08LfJVJK8lIOYNb4MHmj+Bb12lnWEtK9ay5OHvFKtizftpgGTqit0dG
82KHvwInWvxg2GVCkrkCQHjcBlAkCoQxRlfkDlfcZGvb+3JsXfIxUygfFm1F+pmj
8AsAh/30R0U+jPkEfET1RcSguAL29Lrj6Fb+OVuaU8s=
-----END RSA PRIVATE KEY-----";
    }
    function LoginBypass(){
            return "]Q67&!$<IXoOwN?F5(E{1;G7lGG)mkOn4{19sm+69)q1e2!l&R{6_Czp[-g2^09nV6%FE9|REFA3E12EN!P(836S76sOc}2hrnQ<02S~pyo5B7;n}.gYw)SIR=+ewJqb";
    }

?>