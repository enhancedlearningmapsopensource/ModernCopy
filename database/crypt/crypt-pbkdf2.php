<?php
require_once("icrypt.php");

class CryptPbkdf2 implements ICrypt{
	const DEFAULT_ITERATIONS 	= 20000;
	const MIN_SALT_LENGTH 		= 32;	/// Bytes
	const DEFAULT_ALGO 			= "sha256";
	const DEFAULT_OUTPUT_LENTH	= 64;	/// Bytes
	
	public function Encrypt($clearText, $options){
		$pIterations 	= $this->Recover("iterations", $options, self::DEFAULT_ITERATIONS);
		$pSalt 			= $this->Recover("salt", $options, $this->GenerateSalt(self::MIN_SALT_LENGTH));
		$pAlgo			= $this->Recover("algo", $options, self::DEFAULT_ALGO);
		$pOutputLength	= $this->Recover("length", $options, self::DEFAULT_OUTPUT_LENTH);
			
		$mEncrypted 				= array();
		$mEncrypted["hash"] 		= hash_pbkdf2($pAlgo, $clearText, base64_decode($clearText.$pSalt), $pIterations, $pOutputLength);
		$mEncrypted["iterations"] 	= $pIterations;
		$mEncrypted["salt"] 		= $pSalt;
		return $mEncrypted;
	}
	
	public function Decrypt($cipherText, $options){
		throw new Exception("Cannot decrypt pbkdf2 - hashing function");
	}
	
	private function Recover($varName, &$options, $default){
		if(isset($options[$varName]) && $options[$varName] != NULL){
			return $options[$varName];
		}else{
			return $default;
		}
	}
	
	private function GenerateSalt($length){
		return base64_encode("elm-modern-copy-temporary-salt");
		//return base64_encode(mcrypt_create_iv($length, MCRYPT_DEV_URANDOM));
	}
}

?>
