<?php

interface ICrypt{
	public function Encrypt($clearText, $options);
	public function Decrypt($cipherText, $options);
}

?>